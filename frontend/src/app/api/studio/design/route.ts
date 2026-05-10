import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface DesignRequest {
  prompt: string;
  style?: string;
  category?: string;
  gender?: 'male' | 'female';
}

interface DesignResponse {
  designImageUrl: string;
  prompt: string;
}

const TNB_BASE_URL = 'https://thenewblack.ai/api/1.1/wf';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as DesignRequest;
    const { prompt, style, category = 'tops', gender = 'female' } = body;

    if (!prompt?.trim() || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'Prompt must be at least 3 characters' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Prompt must be under 500 characters' }, { status: 400 });
    }

    const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TNB_API_KEY not configured' }, { status: 500 });
    }

    // Build outfit prompt — include style if provided
    const outfit = style ? `${style} style: ${prompt.trim()}` : prompt.trim();

    // TNB /clothing: generates a garment image from text description
    const form = new FormData();
    form.append('outfit', outfit);
    form.append('gender', gender === 'male' ? 'man' : 'woman');
    form.append('country', 'USA');
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
      try {
        const json = JSON.parse(responseText) as Record<string, unknown>;
        const url = (json.response as string) || (json.url as string) || (json.output as string);
        if (!url || !url.startsWith('http')) throw new Error('No URL in response');
        resultUrl = url;
      } catch {
        throw new Error(`TNB design returned unexpected format: ${responseText.slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      designImageUrl: resultUrl,
      prompt: prompt.trim(),
    } satisfies DesignResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/design]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
