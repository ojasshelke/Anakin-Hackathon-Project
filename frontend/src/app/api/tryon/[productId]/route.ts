/**
 * POST /api/tryon/[productId]
 * Drapes a clothing GLB over a user's avatar in the VEXA pipeline.
 * Returns a signed render URL + fit metadata.
 *
 * RULE: Import handleTryOn directly — no internal HTTP calls
 * RULE: Auth via Bearer token from request header
 * RULE: No Math.random() for fitScore — use getFitScore
 * RULE: No `any` types
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { handleTryOn } from '@/app/api/tryon/route';
import { getFitScore } from '@/lib/fitEngine';
import type { TryOnResult } from '@/types';
import type { Database } from '@/types/database';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

/** Shape returned by handleTryOn — explicit type, no `any` */
interface TryOnData {
  resultUrl: string;
  storagePath: string;
  cached: boolean;
  fitLabel: string;
  recommendedSize: string;
  fitScore: number;
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { productId } = await params;

  // 1. Auth: validate Bearer token from request header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Verify the JWT token
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Bearer token' }, { status: 401 });
  }

  const authenticatedUserId = user.id;

  // Service client for DB/storage operations
  const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
    auth: { persistSession: false },
  });

  try {
    // 2. Import handleTryOn directly — no internal HTTP fetch
    const tryOnData: TryOnData = await handleTryOn({ userId: authenticatedUserId, productId }, supabase);

    // 3. Use getFitScore — no Math.random()
    const fitScore = getFitScore(tryOnData.fitLabel);

    // TODO: heatmapUrl — implement real heatmap generation from Python inference service
    const heatmapUrl: string | null = null;

    const result: TryOnResult = {
      id: `res_${productId}_${authenticatedUserId}_${Date.now()}`,
      userId: authenticatedUserId,
      productId,
      result_url: tryOnData.resultUrl,
      resultImage: tryOnData.resultUrl,
      fitScore,
      sizeRecommendation: tryOnData.recommendedSize,
      status: 'ready',
    };

    return NextResponse.json({
      ...result,
      signedExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[/api/tryon/[productId]] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
