/**
 * POST /api/trends
 * Scrapes live fashion trend sources via Anakin, extracts structured
 * trend cards via Gemini, and caches results for 30 minutes.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Trend, TryOnCategory } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ─── Anakin helpers ──────────────────────────────────────────────────────────

const ANAKIN_BASE = 'https://api.anakin.io/v1';

function anakinHeaders(apiKey: string) {
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
}

const TREND_SOURCES = [
  'https://www.myntra.com/trending-now',
  'https://www.vogue.in/fashion/trends',
  'https://www.ajio.com/trending',
];

// ─── 30-minute cache ─────────────────────────────────────────────────────────

interface TrendCache {
  trends: Trend[];
  fetchedAt: number;
}

let trendCache: TrendCache | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Scrape a single URL via Anakin ──────────────────────────────────────────

async function scrapeWithAnakin(url: string, apiKey: string): Promise<string> {
  try {
    const startRes = await fetch(`${ANAKIN_BASE}/url-scraper`, {
      method: 'POST',
      headers: anakinHeaders(apiKey),
      body: JSON.stringify({ url, formats: ['markdown'] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!startRes.ok) return '';

    const startData = await startRes.json() as {
      id?: string; jobId?: string; markdown?: string; status?: string;
    };
    if (startData.markdown) return startData.markdown;

    const jobId = startData.jobId ?? startData.id;
    if (!jobId) return '';

    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 3000));
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

// ─── Anakin Search for supplemental trend signals ────────────────────────────

async function searchTrendSignals(apiKey: string): Promise<string> {
  try {
    const res = await fetch(`${ANAKIN_BASE}/search`, {
      method: 'POST',
      headers: anakinHeaders(apiKey),
      body: JSON.stringify({
        prompt: 'Indian fashion trends trending styles 2025 summer',
        limit: 5,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { results?: Array<{ snippet?: string; title?: string }> };
    return (data.results ?? [])
      .map(r => `## ${r.title ?? ''}\n${r.snippet ?? ''}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

// ─── OpenAI extraction ───────────────────────────────────────────────────────

async function extractTrendsWithOpenAI(combinedContent: string): Promise<Trend[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey: openaiKey });

  const prompt = `
You are a fashion trend analyst for India.
Here is content scraped from Myntra, Vogue India, and AJIO right now:

${combinedContent.slice(0, 8000)}

Extract exactly 6 trending fashion styles from this content.
If content is sparse, use your knowledge of current Indian fashion trends.
Respond ONLY with a JSON array, no markdown fences, no explanation:
[
  {
    "id": "trend-1",
    "name": "Short catchy trend name e.g. Sage Green Minimalism",
    "description": "One sentence what this trend is",
    "designPrompt": "Detailed prompt for AI image generation: describe the garment, color, cut, style, fabric",
    "category": "tops",
    "tags": ["tag1", "tag2"],
    "color": "#hexcolor",
    "emoji": "one relevant emoji"
  }
]
category must be one of: "tops", "bottoms", "one-pieces".
color must be a valid hex color string like "#4A6741".
Return exactly 6 trends. JSON array only, no wrapping.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful JSON data extractor. You only output pure JSON without any markdown formatting.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content?.trim() || '[]';

  // Strip potential markdown code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const parsed = JSON.parse(cleaned) as Array<Record<string, unknown>>;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('OpenAI returned invalid trend data');
  }

  return parsed.slice(0, 6).map((t, i) => ({
    id: (t.id as string) || `trend-${i + 1}`,
    name: (t.name as string) || 'Fashion Trend',
    description: (t.description as string) || 'A trending style right now.',
    designPrompt: (t.designPrompt as string) || (t.name as string) || 'Modern fashion garment',
    category: (['tops', 'bottoms', 'one-pieces'].includes(t.category as string)
      ? t.category
      : 'tops') as TryOnCategory,
    tags: Array.isArray(t.tags) ? (t.tags as string[]).slice(0, 4) : [],
    color: typeof t.color === 'string' && t.color.startsWith('#') ? t.color : '#4A6741',
    emoji: (t.emoji as string) || '✨',
  }));
}


// ─── Static fallback trends (used when Gemini is rate-limited or fails) ──────

const FALLBACK_TRENDS: Trend[] = [
  {
    id: 'trend-1',
    name: 'Sage Green Minimalism',
    description: 'Clean-cut sage green pieces dominating Indian street style this summer.',
    designPrompt: 'A minimalist sage green linen shirt with mandarin collar, relaxed fit, clean lines, premium cotton fabric, muted sage green color',
    category: 'tops',
    tags: ['minimalist', 'linen', 'summer'],
    color: '#9CAF88',
    emoji: '🌿',
  },
  {
    id: 'trend-2',
    name: 'Lavender Dream Kurta',
    description: 'Soft lavender kurtas with delicate chikankari embroidery trending on Myntra.',
    designPrompt: 'An elegant lavender purple kurta with intricate chikankari embroidery, A-line silhouette, three-quarter sleeves, soft cotton fabric',
    category: 'one-pieces',
    tags: ['ethnic', 'embroidery', 'festive'],
    color: '#B8A9C9',
    emoji: '💜',
  },
  {
    id: 'trend-3',
    name: 'Terracotta Cargo Pants',
    description: 'Earthy terracotta cargo pants with utility pockets seen across AJIO collections.',
    designPrompt: 'Terracotta rust colored cargo pants with multiple utility pockets, relaxed straight fit, cotton twill fabric, earthy warm tone',
    category: 'bottoms',
    tags: ['utility', 'streetwear', 'earthy'],
    color: '#C67B5C',
    emoji: '🧱',
  },
  {
    id: 'trend-4',
    name: 'Ivory Crochet Top',
    description: 'Handcrafted ivory crochet tops blending boho aesthetics with Indian craftsmanship.',
    designPrompt: 'A cream ivory crochet knit crop top with intricate floral pattern, scallop edges, short sleeves, boho aesthetic, off-white color',
    category: 'tops',
    tags: ['crochet', 'boho', 'handmade'],
    color: '#F5F0E1',
    emoji: '🧶',
  },
  {
    id: 'trend-5',
    name: 'Indigo Block Print Dress',
    description: 'Traditional indigo block print dresses making a Vogue India comeback.',
    designPrompt: 'A flowing indigo blue block-printed cotton midi dress with traditional Rajasthani motifs, V-neck, tiered skirt, deep indigo blue',
    category: 'one-pieces',
    tags: ['block-print', 'artisan', 'traditional'],
    color: '#3B5998',
    emoji: '💙',
  },
  {
    id: 'trend-6',
    name: 'Butter Yellow Co-ord',
    description: 'Matching butter yellow sets becoming the go-to summer statement.',
    designPrompt: 'A butter yellow matching co-ord set with oversized blazer and high-waisted wide-leg trousers, soft pastel yellow, tailored fit',
    category: 'tops',
    tags: ['co-ord', 'pastel', 'summer'],
    color: '#F5D76E',
    emoji: '🌻',
  },
];

// ─── POST handler ────────────────────────────────────────────────────────────
// Returns curated fallback trends instantly. Anakin scraping only happens
// when the user explicitly clicks "Discover" (via /api/trends/search).

export async function POST(): Promise<NextResponse> {
  console.log('[/api/trends] Serving curated trends (no scraping)');
  return NextResponse.json({ trends: FALLBACK_TRENDS, cached: false, fallback: true });
}
