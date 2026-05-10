/**
 * POST /api/trends/search
 * User sends a custom prompt (e.g. "exclusive jeans design").
 * We use Anakin Search to find trends around that topic,
 * then feed the results to OpenAI to produce 6 structured trend cards.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Trend, TryOnCategory } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANAKIN_BASE = 'https://api.anakin.io/v1';

function anakinHeaders(apiKey: string) {
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
}

// ─── Anakin Search for the user's query ──────────────────────────────────────

async function searchWithAnakin(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(`${ANAKIN_BASE}/search`, {
      method: 'POST',
      headers: anakinHeaders(apiKey),
      body: JSON.stringify({
        prompt: query,
        limit: 8,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { results?: Array<{ snippet?: string; title?: string; url?: string }> };
    return (data.results ?? [])
      .map(r => `## ${r.title ?? ''}\nSource: ${r.url ?? ''}\n${r.snippet ?? ''}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

// ─── Scrape a specific URL via Anakin ────────────────────────────────────────

async function scrapeWithAnakin(url: string, apiKey: string): Promise<string> {
  try {
    const startRes = await fetch(`${ANAKIN_BASE}/url-scraper`, {
      method: 'POST',
      headers: anakinHeaders(apiKey),
      body: JSON.stringify({ url, formats: ['markdown'] }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!startRes.ok) return '';

    const startData = await startRes.json() as {
      id?: string; jobId?: string; markdown?: string; status?: string;
    };
    if (startData.markdown) return startData.markdown;

    const jobId = startData.jobId ?? startData.id;
    if (!jobId) return '';

    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const poll = await fetch(`${ANAKIN_BASE}/url-scraper/${jobId}`, {
        headers: { 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(5000),
      });
      if (!poll.ok) continue;
      const data = await poll.json() as { status?: string; markdown?: string };
      if (data.markdown) return data.markdown;
      if (data.status === 'failed') break;
    }
    return '';
  } catch {
    return '';
  }
}

// ─── OpenAI: generate custom trends from search results ─────────────────────

async function generateCustomTrends(
  userPrompt: string,
  searchContent: string
): Promise<Trend[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey: openaiKey });

  const systemPrompt = `You are an expert fashion trend analyst and designer for India. 
You specialize in turning user requests into actionable, specific fashion trend cards.
You only output pure JSON without any markdown formatting.`;

  const userContent = `
The user is looking for: "${userPrompt}"

Here is real-time web data about this topic gathered via Anakin search:

${searchContent.slice(0, 10000)}

Based on the user's request AND the web data above, generate exactly 6 unique fashion trend cards.
Each trend should be a SPECIFIC, creative design variation related to "${userPrompt}".

For example, if the user asks for "T-shirt designs", give 6 DIFFERENT specific T-shirt styles 
(e.g., "Oversized Vintage Wash Tee", "Minimal Line Art Crop Tee", etc.).

If the user asks for "jeans", give 6 DIFFERENT jeans styles 
(e.g., "Distressed Indigo Wide-Leg", "Acid Wash Cargo Jeans", etc.).

Respond ONLY with a JSON array:
[
  {
    "id": "custom-1",
    "name": "Short catchy design name",
    "description": "One sentence describing this specific design",
    "designPrompt": "VERY detailed prompt for AI image generation: describe the exact garment, color, cut, style, fabric, pattern, silhouette, details",
    "category": "tops",
    "tags": ["tag1", "tag2", "tag3"],
    "color": "#hexcolor",
    "emoji": "one relevant emoji"
  }
]
category must be one of: "tops", "bottoms", "one-pieces".
color must be a valid hex color string.
Make each design unique and creative. The designPrompt should be extremely detailed for image generation.
Return exactly 6 items. JSON array only, no wrapping.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content?.trim() || '[]';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const parsed = JSON.parse(cleaned) as Array<Record<string, unknown>>;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('OpenAI returned invalid trend data');
  }

  return parsed.slice(0, 6).map((t, i) => ({
    id: (t.id as string) || `custom-${i + 1}`,
    name: (t.name as string) || 'Custom Design',
    description: (t.description as string) || 'A unique fashion design.',
    designPrompt: (t.designPrompt as string) || (t.name as string) || 'Modern fashion garment',
    category: (['tops', 'bottoms', 'one-pieces'].includes(t.category as string)
      ? t.category
      : 'tops') as TryOnCategory,
    tags: Array.isArray(t.tags) ? (t.tags as string[]).slice(0, 4) : [],
    color: typeof t.color === 'string' && t.color.startsWith('#') ? t.color : '#4A6741',
    emoji: (t.emoji as string) || '✨',
  }));
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { prompt?: string };
    const userPrompt = body.prompt?.trim();

    if (!userPrompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    console.log(`[/api/trends/search] User prompt: "${userPrompt}"`);

    const anakinKey = process.env.ANAKIN_API_KEY;

    // Step 1: Use Anakin to search the web for trends matching the user's query
    let searchContent = '';
    if (anakinKey) {
      console.log(`[/api/trends/search] Searching Anakin for: "${userPrompt}"`);

      // Run multiple searches in parallel for richer data
      const [searchResults, myntraResults, ajioResults] = await Promise.allSettled([
        searchWithAnakin(`${userPrompt} fashion trends 2025 India design`, anakinKey),
        searchWithAnakin(`${userPrompt} Myntra trending latest`, anakinKey),
        scrapeWithAnakin(`https://www.myntra.com/${encodeURIComponent(userPrompt)}`, anakinKey),
      ]);

      const parts = [searchResults, myntraResults, ajioResults]
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(Boolean);

      searchContent = parts.join('\n\n---\n\n');
      console.log(`[/api/trends/search] Gathered ${searchContent.length} chars of context`);
    }

    // Step 2: Feed everything to OpenAI
    const trends = await generateCustomTrends(
      userPrompt,
      searchContent || `No web data available. Use your extensive knowledge of current Indian fashion trends related to "${userPrompt}" to generate creative designs.`
    );

    console.log(`[/api/trends/search] Generated ${trends.length} custom trends`);

    return NextResponse.json({
      trends,
      prompt: userPrompt,
      sourcesSearched: searchContent.length > 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/trends/search] ERROR:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
