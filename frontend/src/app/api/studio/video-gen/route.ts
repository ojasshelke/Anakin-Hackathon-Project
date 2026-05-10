import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface VideoGenRequest {
  imageUrl: string;
  prompt?: string;
  duration?: '5' | '10';
}

interface VideoGenResponse {
  videoUrl?: string;
  frameUrls?: string[];
  type: 'video' | 'frames';
}

const TNB_BASE_URL = 'https://thenewblack.ai/api/1.1/wf';
const TNB_POLL_INTERVAL_MS = 4000;
const TNB_MAX_POLLS = 30;
const DEFAULT_PROMPT = 'Fashion model naturally showcasing the outfit with elegant movements';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as VideoGenRequest;
    const { imageUrl, prompt, duration = '5' } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.TNB_API_KEY || process.env.NEWBLACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TNB_API_KEY not configured' }, { status: 500 });
    }

    const finalPrompt = prompt?.trim() && prompt.trim().length >= 3 ? prompt.trim() : DEFAULT_PROMPT;
    const finalDuration = duration === '10' ? '10' : '5';

    // Start video generation
    const form = new FormData();
    form.append('image', imageUrl);
    form.append('prompt', finalPrompt);
    form.append('time', finalDuration);

    const startRes = await fetch(`${TNB_BASE_URL}/ai-video?api_key=${apiKey}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!startRes.ok) {
      const errText = await startRes.text().catch(() => 'unknown');
      throw new Error(`TNB video-gen failed (${startRes.status}): ${errText}`);
    }

    const startText = (await startRes.text()).trim();

    // Parse job ID
    let jobId: string;
    try {
      const json = JSON.parse(startText) as Record<string, unknown>;
      jobId = (json.id as string) || (json.job_id as string) || startText;
    } catch {
      jobId = startText;
    }

    if (!jobId) throw new Error('TNB video-gen returned empty job ID');

    // If start returned a URL directly, return it
    if (jobId.startsWith('http')) {
      return NextResponse.json({ videoUrl: jobId, type: 'video' } satisfies VideoGenResponse);
    }

    // Poll for result
    for (let i = 0; i < TNB_MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, TNB_POLL_INTERVAL_MS));

      const pollForm = new FormData();
      pollForm.append('id', jobId);

      const pollRes = await fetch(`${TNB_BASE_URL}/results_video?api_key=${apiKey}`, {
        method: 'POST',
        body: pollForm,
        signal: AbortSignal.timeout(30_000),
      });

      if (!pollRes.ok) continue;

      const pollText = (await pollRes.text()).trim();
      if (pollText && pollText.startsWith('http')) {
        return NextResponse.json({ videoUrl: pollText, type: 'video' } satisfies VideoGenResponse);
      }
    }

    throw new Error('TNB video-gen timeout after 2 minutes');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/studio/video-gen]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
