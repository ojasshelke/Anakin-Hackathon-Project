import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface ModelGenRequest {
  garmentImageUrl: string;
  modelGender?: 'male' | 'female';
}

interface ModelGenResponse {
  modelImageUrl: string;
}

const TNB_BASE_URL = 'https://thenewblack.ai/api/1.1/wf';
const TNB_POLL_INTERVAL_MS = 3000;
const TNB_MAX_POLLS = 40;

async function pollForResult(jobId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < TNB_MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, TNB_POLL_INTERVAL_MS));

    const form = new FormData();
    form.append('id', jobId);

    const res = await fetch(`${TNB_BASE_URL}/results?api_key=${apiKey}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000),
    });

    const text = (await res.text()).trim();
    if (text && text.startsWith('http')) return text;
    if (text && text !== 'Processing...') {
      // Try JSON parse
      try {
        const json = JSON.parse(text) as Record<string, unknown>;
        const url = (json.response as string) || (json.url as string) || (json.output as string);
        if (url && typeof url === 'string' && url.startsWith('http')) return url;
      } catch {
        // plain text, not a URL yet
      }
    }
  }
  throw new Error('TNB timeout after 2 minutes');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ModelGenRequest;
    const { garmentImageUrl, modelGender = 'female' } = body;

    if (!garmentImageUrl) {
      return NextResponse.json({ error: 'garmentImageUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TNB_API_KEY not configured' }, { status: 500 });
    }

    // TNB /generated-models: async, returns job ID, poll via /results
    const form = new FormData();
    form.append('clothing_image', garmentImageUrl);
    form.append('type', 'tops');
    form.append('gender', modelGender === 'male' ? 'man' : 'woman');
    form.append('country', 'USA');
    form.append('age', '25');
    form.append('other_clothes', '');
    form.append('image_context', 'professional studio fashion photo, white background');
    form.append('width', '900');
    form.append('height', '1200');
    form.append('view', 'front');
    form.append('model info', 'professional fashion model');
    form.append('background', 'modern minimalist studio, pure white background');
    form.append('ratio', '9:16');

    const startRes = await fetch(`${TNB_BASE_URL}/generated-models?api_key=${apiKey}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000),
    });

    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => 'unknown');
      throw new Error(`TNB model-gen failed (${startRes.status}): ${errText}`);
    }

    const jobId = (await startRes.text()).trim();
    if (!jobId) throw new Error('TNB model-gen returned empty job ID');

    // If response is already a URL (some keys get sync response)
    if (jobId.startsWith('http')) {
      return NextResponse.json({ modelImageUrl: jobId } satisfies ModelGenResponse);
    }

    const resultUrl = await pollForResult(jobId, apiKey);

    return NextResponse.json({ modelImageUrl: resultUrl } satisfies ModelGenResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/model-gen]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
