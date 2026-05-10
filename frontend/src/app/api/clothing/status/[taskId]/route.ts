import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ClothingAssetRow } from '@/types/database';

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse> {
  const { taskId } = await params;

  const meshyKey = process.env.MESHY_API_KEY;
  if (!meshyKey) {
    return NextResponse.json({ error: 'MESHY_API_KEY not configured' }, { status: 500 });
  }

  const pollRes = await fetch(`${MESHY_API_BASE}/image-to-3d/${taskId}`, {
    headers: { Authorization: `Bearer ${meshyKey}` },
  });

  if (!pollRes.ok) {
    return NextResponse.json({ error: 'Failed to poll Meshy task' }, { status: 502 });
  }

  const pollData = await pollRes.json() as { status: string; model_urls?: { glb?: string } };

  if (pollData.status === 'SUCCEEDED' && pollData.model_urls?.glb) {
    const glbUrl = pollData.model_urls.glb;

    // Update Supabase record
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    await supabase
      .from('clothing_assets')
      .update({ glb_url: glbUrl, status: 'ready' } satisfies Pick<ClothingAssetRow, 'glb_url' | 'status'>)
      .eq('meshy_task_id', taskId);

    return NextResponse.json({ status: 'ready', glbUrl });
  }

  if (pollData.status === 'FAILED') {
    return NextResponse.json({ status: 'failed', glbUrl: null });
  }

  return NextResponse.json({ status: 'pending', glbUrl: null });
}
