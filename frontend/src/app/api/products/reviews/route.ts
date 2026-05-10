import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ReviewInsights } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_INSIGHTS: ReviewInsights = {
  fitVerdict: 'True to Size',
  sizeAdvice: 'Order your regular size',
  qualityScore: 7,
  fabricFeel: 'Soft',
  buyerSentiment: 'Positive',
  topPraise: 'Good quality for the price',
  topComplaint: null,
  returnRisk: 'Low',
  bestFor: 'Casual daily wear',
  reviewCount: 0,
};

async function scrapeMarkdown(url: string, apiKey: string): Promise<string> {
  const startRes = await fetch('https://api.anakin.io/v1/url-scraper', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'] }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!startRes.ok) throw new Error(`scraper start failed: ${startRes.status}`);

  const startData = await startRes.json() as { id?: string; jobId?: string; markdown?: string };
  if (startData.markdown) return startData.markdown;

  const jobId = startData.jobId ?? startData.id;
  if (!jobId) throw new Error('No job id');

  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await fetch(`https://api.anakin.io/v1/url-scraper/${jobId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!poll.ok) continue;
    const data = await poll.json() as { status?: string; markdown?: string };
    if (data.markdown || data.status === 'completed') return data.markdown ?? '';
    if (data.status === 'failed') throw new Error('scraper failed');
  }
  throw new Error('scraper timed out');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { productUrl, productName } = await req.json() as { productUrl: string; productName: string };
    if (!productUrl || !productName) return NextResponse.json(DEFAULT_INSIGHTS);

    const anakinKey = process.env.ANAKIN_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!anakinKey || !geminiKey) return NextResponse.json(DEFAULT_INSIGHTS);

    let scrapedContent = '';
    try {
      scrapedContent = await scrapeMarkdown(productUrl, anakinKey);
    } catch (e) {
      console.error('[reviews] scrape failed:', e);
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a fashion fit analyst for an AI try-on platform.
Here are real buyer reviews for '${productName}' scraped from a fashion website:

${scrapedContent.slice(0, 6000)}

Extract fit intelligence from these reviews.
If there are no reviews in the content, make a best guess from product description.
Respond ONLY with valid JSON, no markdown, no explanation:
{
  "fitVerdict": "True to Size" or "Runs Small" or "Runs Large",
  "sizeAdvice": "single actionable sentence like: Order your normal size",
  "qualityScore": number 1-10,
  "fabricFeel": "single word: Soft/Rough/Stretchy/Stiff/Smooth",
  "buyerSentiment": "Positive" or "Mixed" or "Negative",
  "topPraise": "most common positive feedback in one sentence",
  "topComplaint": "most common complaint or null if none",
  "returnRisk": "Low" or "Medium" or "High",
  "bestFor": "who or what occasion this suits best",
  "reviewCount": estimated number of reviews analyzed or 0
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const insights = JSON.parse(jsonText) as ReviewInsights;

    return NextResponse.json(insights);
  } catch (e) {
    console.error('[reviews] route error:', e);
    return NextResponse.json(DEFAULT_INSIGHTS);
  }
}
