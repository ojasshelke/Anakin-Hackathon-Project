import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VideoTryOnStartResponse } from '@/types';

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL or key not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

interface VideoTryOnRequestBody {
  userId: string;
  videoUrl: string;
  productImageUrl: string;
  productId: string;
}

function parseVideoBody(raw: unknown): VideoTryOnRequestBody | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const userId = o.userId;
  const videoUrl = o.videoUrl;
  const productImageUrl = o.productImageUrl;
  const productId = o.productId;
  if (typeof userId !== 'string' || userId.length === 0) return null;
  if (typeof videoUrl !== 'string' || videoUrl.length === 0) return null;
  if (typeof productImageUrl !== 'string' || productImageUrl.length === 0)
    return null;
  if (typeof productId !== 'string' || productId.length === 0) return null;
  return { userId, videoUrl, productImageUrl, productId };
}

interface VideoJobInsertRow {
  id: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = parseVideoBody(parsed);
    if (!body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Authentication Check (Bearer Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. IDOR Prevention: verify user is requesting session for themselves
    if (body.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot create video tryon for another user' }, { status: 403 });
    }

    const { userId, videoUrl, productImageUrl, productId } = body;
    const supabase = getSupabase();

    const { data: job, error: insertError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: userId,
        product_id: productId,
        input_video_url: videoUrl,
        product_image_url: productImageUrl,
        status: 'processing',
        progress_percent: 0,
      })
      .select('id')
      .single();

    if (insertError || !job) {
      throw new Error(insertError?.message ?? 'Failed to create video job');
    }

    const row = job as VideoJobInsertRow;

    const pyUrl = process.env.AVATAR_SERVICE_URL?.replace(/\/$/, '');
    if (pyUrl) {
      void fetch(`${pyUrl}/process-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: row.id,
          video_url: videoUrl,
          garment_image_url: productImageUrl,
        }),
      }).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[video] Python dispatch failed:', msg);
      });
    }

    const payload: VideoTryOnStartResponse = {
      jobId: row.id,
      status: 'processing',
      message:
        'Video try-on started. Poll /api/tryon/video/status for progress.',
    };

    return NextResponse.json(payload, { status: 202 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/tryon/video]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
