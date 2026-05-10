/**
 * POST /api/trends/generate
 * Generates a garment-only product image from a trend's design prompt
 * using OpenAI DALL-E 3 (flat lay, no model).
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Trend } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

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

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[/api/trends/generate] Generating garment: "${trend.name}"`);

    const openai = new OpenAI({ apiKey: openaiKey });

    const prompt = `Professional e-commerce product photography of ${trend.designPrompt}. The garment is laid flat on a clean pure white background. No person, no model, no mannequin, no human body. Only the clothing item itself, displayed as a flat lay product shot. Studio lighting, high resolution, sharp details.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const resultUrl = response.data[0]?.url;
    if (!resultUrl) {
      throw new Error('No image URL returned from DALL-E');
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
