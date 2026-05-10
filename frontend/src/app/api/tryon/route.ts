/**
 * POST /api/tryon
 * Core try-on engine — The New Black AI (only provider).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/rateLimit';
import { validateApiKey } from '@/lib/apiKeyMiddleware';
import { getFitRecommendation, getFitScore } from '@/lib/fitEngine';
import type { MarketplaceContext } from '@/types';
import type { ClothingAssetRow, Database } from '@/types/database';
import { uploadToR2 } from '@/lib/r2';

// ─── Next.js route config ─────────────────────────────────────────────────────
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ─── The New Black AI ─────────────────────────────────────────────────────────
// Docs: thenewblack.ai/clothing_fashion_api_integrations
const TNB_BASE_URL = 'https://thenewblack.ai/api/1.1/wf';
const TNB_POLL_INTERVAL_MS = 3000;
const TNB_MAX_POLLS = 40;
const TNB_FETCH_TIMEOUT_MS = 120_000;

export type TryOnCategory =
  | 'tops'
  | 'bottoms'
  | 'one-pieces'
  | 'shoes'
  | 'bags'
  | 'accessories'
  | 'jewelry';

// ─── SSRF Protection ──────────────────────────────────────────────────────────

const ALLOWED_STORAGE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin; } catch { return null; } })()
  : null;

function validateSecureUrl(url: string, description: string): string {
  if (!url) throw new Error(`${description} is required`);
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error(`${description} is not a valid URL`); }
  if (!ALLOWED_STORAGE_ORIGIN) return url;
  const allowedOrigins = [
    ALLOWED_STORAGE_ORIGIN,
    'https://images.unsplash.com',
    'https://cdn.shopify.com',
    'https://thenewblack.ai',
    'https://api.thenewblack.ai',
  ];
  const isAllowed = allowedOrigins.some((o) => parsed.origin === o)
    || parsed.origin.endsWith('.supabase.co')
    || parsed.origin.endsWith('.r2.dev')
    || parsed.origin.endsWith('.cdn.bubble.io');
  if (!isAllowed) throw new Error(`${description} origin not allowed: ${parsed.origin}`);
  return url;
}

// ─── Supabase helper ──────────────────────────────────────────────────────────

function getServiceSupabase(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables missing');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

async function ensureBucketExists(supabase: SupabaseClient<Database>, bucketName: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }
  } catch (err) { console.error(`[Supabase] Bucket error:`, err); }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

interface AuthResult { userId: string; marketplace: MarketplaceContext | null; }

async function authenticateRequest(req: NextRequest, bodyUserId: string): Promise<AuthResult | NextResponse> {
  const marketplaceCtx = await validateApiKey(req);
  if (marketplaceCtx) {
    if (!bodyUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const supabase = getServiceSupabase();
    const { data: userRecord } = await supabase.from('users').select('marketplace_id').eq('id', bodyUserId).single();
    if (!userRecord) {
      if (marketplaceCtx.marketplaceId === 'mkt_dev') {
        await (supabase.from('users') as any).upsert({ id: bodyUserId, email: `${bodyUserId}@vexa.guest` });
        return { userId: bodyUserId, marketplace: marketplaceCtx };
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return { userId: bodyUserId, marketplace: marketplaceCtx };
  }
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const supabase = getServiceSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { userId: user.id, marketplace: null };
  }
  const guestId = bodyUserId || 'demo_user_001';
  const supabase = getServiceSupabase();
  await (supabase.from('users') as any).upsert({ id: guestId, email: `${guestId}@vexa.guest` });
  return { userId: guestId, marketplace: null };
}

async function resolveToPublicUrl(url: string, label: string, userId: string, supabase: SupabaseClient<Database>): Promise<string> {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  if (!url.startsWith('data:') && !url.includes(',')) {
    try {
      const bucket = 'avatars';
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(url, 3600);
      if (signed?.signedUrl) return signed.signedUrl;
    } catch (e) {
      console.warn(`[resolveToPublicUrl] Failed to sign path ${url}:`, e);
    }
    return url;
  }

  const [meta, b64] = url.split(',');
  if (!b64) return url;

  const mime = meta?.slice(5).split(';')[0] || 'image/png';
  const ext = mime.split('/')[1] || 'png';
  const buffer = Buffer.from(b64, 'base64');
  const filename = `uploads/${userId}_${label}_${Date.now()}.${ext}`;

  const r2Url = await uploadToR2(buffer, filename, mime);
  if (r2Url) return r2Url;

  await supabase.storage.from('avatars').upload(filename, buffer, { contentType: mime, upsert: true });
  const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(filename, 3600);
  return signed?.signedUrl || url;
}

// ─── Persist generated image to R2/Supabase ──────────────────────────────────
// TNB deletes images after 48h — persist immediately.

async function persistResultImage(
  imageUrl: string,
  userId: string,
  productId: string,
  supabase: SupabaseClient<Database>,
): Promise<string> {
  try {
    console.log('[Persist] Downloading result image to save permanently...');
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.warn(`[Persist] Failed to download (${res.status}), using original URL`);
      return imageUrl;
    }
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';

    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      console.warn('[Persist] Downloaded content is not an image, using original URL');
      return imageUrl;
    }

    const ext = contentType.split('/')[1]?.split(';')[0] || 'png';
    const filename = `tryon_results/${userId}_${productId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, arrayBuffer, { contentType, upsert: true });

    if (!uploadError) {
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(filename, 86400 * 365);
      if (signed?.signedUrl) {
        console.log('[Persist] Saved to Supabase Storage');
        return signed.signedUrl;
      }
    }

    console.warn('[Persist] All storage failed, using original URL (expires in 48h)');
    return imageUrl;
  } catch (err) {
    console.warn('[Persist] Failed to persist image, using original URL:', err);
    return imageUrl;
  }
}

// ─── TNB response parser (sync endpoints) ────────────────────────────────────
// TNB returns either a plain-text URL or JSON { status, response }

function parseTNBSyncResponse(responseText: string, label: string): string {
  const trimmed = responseText.trim();

  const extractValidUrl = (u: any) => {
    if (u && typeof u === 'string' && u.startsWith('http')) {
      try { new URL(u); return u; } catch { return null; }
    }
    return null;
  };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    if (json.status && json.status !== 'success') {
      throw new Error(`TNB ${label} error: ${json.status} — ${(json as any).message || (json as any).error || 'unknown'}`);
    }
    const url = extractValidUrl(json.response) || extractValidUrl(json.image) || extractValidUrl(json.url) || extractValidUrl(json.output);
    if (url) return url;
    throw new Error(`TNB ${label} returned success but no valid image URL: ${trimmed.slice(0, 100)}`);
  }

  const validPlainUrl = extractValidUrl(trimmed);
  if (validPlainUrl) return validPlainUrl;
  
  throw new Error(`TNB ${label} returned unexpected format: ${trimmed.slice(0, 100)}`);
}

// ─── The New Black — Clothing Try-On ─────────────────────────────────────────

async function callTNBClothingTryon(
  personImageUrl: string,
  garmentImageUrl: string,
  category: TryOnCategory,
): Promise<string> {
  const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
  if (!apiKey) throw new Error('TNB_API_KEY not configured');

  const promptText = category === 'bottoms'
    ? 'Put this bottom/pants on the model'
    : category === 'one-pieces'
      ? 'Put this dress/outfit on the model'
      : 'Put this top/shirt on the model';

  console.log(`[TNB] Clothing try-on · category: ${category}`);

  const formData = new FormData();
  formData.append('model_photo', personImageUrl);
  formData.append('clothing_photo', garmentImageUrl);
  formData.append('prompt', promptText);
  formData.append('ratio', 'auto');

  const res = await fetch(`${TNB_BASE_URL}/vto_stream?api_key=${apiKey}`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(TNB_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`TNB clothing try-on failed (${res.status}): ${errText}`);
  }

  return parseTNBSyncResponse(await res.text(), 'clothing');
}

// ─── The New Black — Shoes Try-On ────────────────────────────────────────────

async function callTNBShoesTryon(
  personImageUrl: string,
  shoeImageUrl: string,
): Promise<string> {
  const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
  if (!apiKey) throw new Error('TNB_API_KEY not configured');

  console.log('[TNB] Shoes try-on');

  const formData = new FormData();
  formData.append('model_photo', personImageUrl);
  formData.append('shoes_photo', shoeImageUrl);

  const res = await fetch(`${TNB_BASE_URL}/vto-shoes?api_key=${apiKey}`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(TNB_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`TNB shoes try-on failed (${res.status}): ${errText}`);
  }

  return parseTNBSyncResponse(await res.text(), 'shoes');
}

// ─── The New Black — Accessory Try-On ────────────────────────────────────────

async function callTNBAccessoryTryon(
  personImageUrl: string,
  accessoryImageUrl: string,
  type: 'bags' | 'accessories' | 'jewelry',
): Promise<string> {
  const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
  if (!apiKey) throw new Error('TNB_API_KEY not configured');

  const formData = new FormData();
  formData.append('model_photo', personImageUrl);

  let endpoint: string;
  if (type === 'bags') {
    endpoint = 'vto-bag';
    formData.append('bag_photo', accessoryImageUrl);
    formData.append('description', 'the bag');
  } else if (type === 'jewelry') {
    endpoint = 'vto-jewelry';
    formData.append('jewelry_photo', accessoryImageUrl);
    formData.append('description', 'the jewelry');
  } else {
    endpoint = 'vto-accessory';
    formData.append('accessory_photo', accessoryImageUrl);
    formData.append('description', 'the accessory');
  }

  console.log(`[TNB] Accessory try-on · type: ${type} · endpoint: ${endpoint}`);

  const res = await fetch(`${TNB_BASE_URL}/${endpoint}?api_key=${apiKey}`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(TNB_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`TNB ${type} try-on failed (${res.status}): ${errText}`);
  }

  return parseTNBSyncResponse(await res.text(), type);
}

// ─── Race helper: run N parallel attempts, return first success ───────────────

async function raceRequests<T>(factories: Array<() => Promise<T>>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let errors = 0;
    const total = factories.length;
    for (const factory of factories) {
      factory()
        .then((result) => {
          if (!settled) { settled = true; resolve(result); }
        })
        .catch((err) => {
          errors++;
          if (errors === total && !settled) {
            settled = true;
            reject(err);
          }
        });
    }
  });
}

// ─── handleTryOn ──────────────────────────────────────────────────────────────

export async function handleTryOn(input: any, supabase: SupabaseClient<Database>) {
  const { userId, productId, userPhotoUrl, productImageUrl, category, garments } = input;

  // ── Fast cache check (2s timeout — never blocks hot path) ───────────────────
  try {
    const cachePromise = (supabase.from('tryon_results') as any)
      .select('result_url,fit_label,recommended_size')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single() as Promise<{ data: { result_url?: string; fit_label?: string; recommended_size?: string } | null }>;
    const timeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 2000)
    );
    const { data: cached } = await Promise.race([cachePromise, timeoutPromise]);
    if (cached?.result_url) {
      console.log('[/api/tryon] Cache hit');
      return { resultUrl: cached.result_url, cached: true, fitLabel: cached.fit_label || 'True to size', recommendedSize: cached.recommended_size || 'M', fitScore: getFitScore(cached.fit_label || '') };
    }
  } catch { /* cache miss — continue */ }

  const pUrl = await resolveToPublicUrl(userPhotoUrl, 'person', userId, supabase);
  let resUrl = pUrl;

  const itemsToProcess = garments || (productImageUrl ? [{ url: productImageUrl, category: category ?? 'tops' }] : []);

  for (const item of itemsToProcess) {
    const gUrl = await resolveToPublicUrl(item.url, 'garment', userId, supabase);
    const cat = item.category as TryOnCategory;
    console.log(`[/api/tryon] TNB race · category: ${cat}`);

    if (cat === 'shoes') {
      resUrl = await raceRequests([
        () => callTNBShoesTryon(resUrl, gUrl),
        () => callTNBShoesTryon(resUrl, gUrl),
        () => callTNBShoesTryon(resUrl, gUrl),
      ]);
    } else if (cat === 'bags' || cat === 'accessories' || cat === 'jewelry') {
      resUrl = await raceRequests([
        () => callTNBAccessoryTryon(resUrl, gUrl, cat),
        () => callTNBAccessoryTryon(resUrl, gUrl, cat),
        () => callTNBAccessoryTryon(resUrl, gUrl, cat),
      ]);
    } else {
      resUrl = await raceRequests([
        () => callTNBClothingTryon(resUrl, gUrl, cat),
        () => callTNBClothingTryon(resUrl, gUrl, cat),
        () => callTNBClothingTryon(resUrl, gUrl, cat),
      ]);
    }
  }

  // ── Return result IMMEDIATELY — persist & cache in background ────────────────
  const rec = { fitLabel: 'True to size', recommendedSize: 'M' };

  // Fire-and-forget: persist image + save to DB (does NOT block response)
  Promise.resolve().then(async () => {
    try {
      const persistedUrl = await persistResultImage(resUrl, userId, productId, supabase);
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      const { data: chart } = await supabase.from('size_charts').select('*').eq('product_id', productId);
      const finalRec = (user && chart?.length) ? getFitRecommendation(user, chart) : rec;
      await (supabase.from('tryon_results') as any).upsert({
        user_id: userId, product_id: productId, result_url: persistedUrl,
        fit_label: finalRec.fitLabel, recommended_size: finalRec.recommendedSize, status: 'ready',
      });
      console.log('[/api/tryon] Background: persisted & cached result');
    } catch (e) { console.warn('[/api/tryon] Background persist failed:', e); }
  });

  return { resultUrl: resUrl, cached: false, ...rec, fitScore: getFitScore(rec.fitLabel) };
}

// ─── Logging helper ─────────────────────────────────────────────────────────

async function logUsage(supabase: SupabaseClient<Database>, data: any) {
  try {
    await (supabase.from('usage_logs') as any).insert({
      user_id: data.userId, provider: 'thenewblack', status: data.status, error_message: data.errorMessage,
      latency_ms: data.latencyMs, ip_address: data.ipAddress,
      device_info: data.deviceInfo, user_email: data.userEmail,
    });
  } catch (e) { console.error('Logging failed', e); }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  if (req.headers.get('x-debug-ping') === 'true') {
    return NextResponse.json({ status: 'alive', time: new Date().toISOString() });
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const ua = req.headers.get('user-agent') || '';
  let deviceInfo = 'Windows';
  if (ua.includes('Macintosh')) deviceInfo = 'Mac';
  else if (ua.includes('iPhone') || ua.includes('iPad')) deviceInfo = 'iOS';
  else if (ua.includes('Android')) deviceInfo = 'Android';

  const supabase = getServiceSupabase();
  try {
    const { userId, userPhotoUrl, productImageUrl, productId, category, garments } = await req.json();
    const auth = await authenticateRequest(req, userId);
    if (auth instanceof NextResponse) return auth;

    const result = await handleTryOn({ userId: auth.userId, productId, userPhotoUrl, productImageUrl, category, garments }, supabase);

    let email: string | undefined;
    if (auth.userId !== 'anonymous') {
      supabase.auth.admin.getUserById(auth.userId).then(r => { email = r.data?.user?.email; }).catch(() => {});
    }

    await logUsage(supabase, { userId: auth.userId, status: 'success', latencyMs: Date.now() - startTime, ipAddress: ip, deviceInfo, userEmail: email });
    return NextResponse.json({ ...result, status: 'ready' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/tryon] ERROR:', message);
    await logUsage(supabase, { userId: 'anonymous', status: 'error', errorMessage: message, latencyMs: Date.now() - startTime, ipAddress: ip, deviceInfo });
    // Surface the real error in development, generic message in production
    const clientMsg = process.env.NODE_ENV === 'development'
      ? message
      : 'Try-on temporarily unavailable. Please try again.';
    return NextResponse.json({ error: clientMsg }, { status: 503 });
  }
}
