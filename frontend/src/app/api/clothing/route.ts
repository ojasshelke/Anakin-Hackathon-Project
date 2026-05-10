import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ProductCategory } from '@/types';

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL or key not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

interface ClothingRequestBody {
  productId: string;
  productImageUrl: string;
  category: ProductCategory;
}

const ALLOWED_CATEGORIES: readonly ProductCategory[] = [
  'clothing',
  'shoes',
  'hats',
  'jewelry',
  'bags',
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'accessories',
];

function isProductCategory(value: string): value is ProductCategory {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(value);
}

interface MeshyCreateResponse {
  result: string;
}

interface MeshyTaskResponse {
  status: string;
  model_urls?: {
    glb?: string;
  };
}

interface ClothingApiSuccess {
  glbUrl: string;
  cached: boolean;
}

interface ClothingApiError {
  error: string;
}

function parseRequestBody(raw: unknown): ClothingRequestBody | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const productId = o.productId;
  const productImageUrl = o.productImageUrl;
  const category = o.category;
  if (typeof productId !== 'string' || productId.length === 0) return null;
  if (typeof productImageUrl !== 'string' || productImageUrl.length === 0)
    return null;
  if (typeof category !== 'string' || !isProductCategory(category)) return null;
  return { productId, productImageUrl, category };
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ClothingApiSuccess | ClothingApiError>> {
  try {
    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = parseRequestBody(parsed);
    if (!body) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const { productId, productImageUrl, category } = body;
    const supabase = getSupabase();

    const { data: cached } = await supabase
      .from('clothing_assets')
      .select('glb_url')
      .eq('product_id', productId)
      .maybeSingle();

    if (cached?.glb_url) {
      return NextResponse.json({ glbUrl: cached.glb_url, cached: true });
    }

    const meshyKey = process.env.MESHY_API_KEY;
    if (!meshyKey) {
      return NextResponse.json(
        { error: 'MESHY_API_KEY not configured' },
        { status: 500 }
      );
    }

    const taskRes = await fetch(`${MESHY_API_BASE}/image-to-3d`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${meshyKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: productImageUrl,
        enable_pbr: true,
        should_texture: true,
        should_remesh: true,
        ai_model: 'latest',
        topology: 'quad',
        target_polycount: 30000,
      }),
    });

    if (!taskRes.ok) {
      const errText = await taskRes.text();
      throw new Error(`Meshy task creation failed: ${errText}`);
    }

    const taskJson: unknown = await taskRes.json();
    if (
      typeof taskJson !== 'object' ||
      taskJson === null ||
      !('result' in taskJson) ||
      typeof (taskJson as MeshyCreateResponse).result !== 'string'
    ) {
      throw new Error('Meshy task creation returned unexpected payload');
    }
    const taskId = (taskJson as MeshyCreateResponse).result;

    // Submit task to Meshy — DO NOT poll here (serverless timeout risk)
    // Persist pending task to Supabase for client to poll via /api/clothing/status/[taskId]
    const { error: upsertError } = await supabase.from('clothing_assets').upsert(
      {
        product_id: productId,
        product_image_url: productImageUrl,
        category,
        meshy_task_id: taskId,
        glb_url: null,
        status: 'pending',
      } as any,
      { onConflict: 'product_id' }
    );

    if (upsertError) {
      console.error('[/api/clothing] Supabase upsert:', upsertError.message);
    }

    return NextResponse.json({ taskId, status: 'pending', cached: false } as any);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/clothing]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
