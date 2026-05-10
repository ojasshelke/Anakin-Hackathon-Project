/**
 * POST /api/trends/generate
 * Generates a garment image from a trend's design prompt
 * using The New Black AI (same engine as /api/studio/design).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Trend } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const TNB_BASE_URL = 'https://thenewblack.ai/api/1.1/wf';

interface GenerateRequest {
  trend: Trend;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { trend } = body;

    if (!trend?.designPrompt) {
      return NextResponse.json({ error: 'trend.designPrompt is required' }, { status: 400 });
    }

    const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TNB_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[/api/trends/generate] Generating: "${trend.name}" — ${trend.designPrompt.slice(0, 80)}...`);

    // Use TNB /clothing endpoint (same as /api/studio/design)
    const form = new FormData();
    form.append('outfit', trend.designPrompt);
    form.append('gender', 'woman');
    form.append('country', 'India');
    form.append('age', '25');
    form.append('width', '900');
    form.append('height', '1200');
    form.append('ratio', '3:4');
    form.append('background', 'clean white studio background');

    const res = await fetch(`${TNB_BASE_URL}/clothing?api_key=${apiKey}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      throw new Error(`TNB design failed (${res.status}): ${errText}`);
    }

    const responseText = (await res.text()).trim();
    let resultUrl: string;

    if (responseText.startsWith('http')) {
      resultUrl = responseText;
    } else {
      const json = JSON.parse(responseText) as Record<string, unknown>;
      const url = (json.response as string) || (json.url as string) || (json.output as string);
      if (!url || !url.startsWith('http')) {
        throw new Error('No URL in TNB response');
      }
      resultUrl = url;
    }

    return NextResponse.json({
      imageUrl: resultUrl,
      trend,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/trends/generate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
