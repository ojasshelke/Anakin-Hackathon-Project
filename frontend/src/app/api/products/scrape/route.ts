import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Outfit, TryOnCategory } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANAKIN_BASE = 'https://api.anakin.io/v1';

function anakinHeaders(apiKey: string) {
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
}

// FIX 3 — smarter image extraction
function extractBestProductImage(markdown: string): string | null {
  const allImages = [...markdown.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)]
    .map(m => m[1]);
  if (allImages.length === 0) return null;

  const productImage = allImages.find(url =>
    (url.includes('assets') ||
      url.includes('product') ||
      url.includes('catalog') ||
      url.includes('media') ||
      url.includes('img') ||
      url.includes('cdn')) &&
    !url.includes('logo') &&
    !url.includes('banner') &&
    !url.includes('icon') &&
    !url.includes('brand') &&
    (url.includes('.jpg') || url.includes('.jpeg') ||
      url.includes('.png') || url.includes('.webp'))
  );

  return productImage ?? allImages[0] ?? null;
}

// FIX 4 — name relevance check
function nameMatchesQuery(name: string, query: string): boolean {
  const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
  const nameLower = name.toLowerCase();
  const clothingWords = [
    'shirt', 'tshirt', 't-shirt', 'top', 'dress', 'pant', 'jeans',
    'kurta', 'jacket', 'hoodie', 'sweater', 'coat', 'shoes', 'bag',
    'watch', 'saree', 'suit', 'blazer', 'kurti', 'lehenga', 'skirt',
    'trouser', 'shorts', 'salwar', 'dupatta', 'palazzo',
  ];
  return queryWords.some(w => nameLower.includes(w)) ||
    clothingWords.some(w => nameLower.includes(w));
}

// FIX 5 — parseProduct accepts originalQuery
function parseProduct(
  markdown: string,
  html: string,
  sourceUrl: string,
  originalQuery: string,
): Outfit | null {
  // FIX 3: use smarter image extraction from markdown first
  let imageUrl = extractBestProductImage(markdown) ?? '';

  // HTML fallback: CDN images
  if (!imageUrl) {
    const cdnImgs = html.match(/https:\/\/assets\.[^\s"'<>]+\.(?:jpg|jpeg|png|webp)[^\s"'<>]*/gi) ?? [];
    const hires = cdnImgs.find(u => u.includes('h_1440') || u.includes('q_100'));
    imageUrl = hires ?? cdnImgs[0] ?? '';
  }
  if (!imageUrl) return null;

  const priceMatch = markdown.match(/[₹₨][\s]*([\d,]+)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 999;

  const nameMatch = markdown.match(/^#{1,2}\s+(.+)$/m);
  let name = nameMatch ? nameMatch[1].trim().slice(0, 60) : 'Fashion Item';

  // FIX 4: if name doesn't match query, use query as name
  if (!nameMatchesQuery(name, originalQuery)) {
    name = originalQuery.charAt(0).toUpperCase() + originalQuery.slice(1);
  }

  const text = (sourceUrl + markdown).toLowerCase();
  const category: TryOnCategory =
    text.includes('shoe') || text.includes('footwear') || text.includes('sneaker') ? 'shoes'
      : text.includes('bag') || text.includes('handbag') || text.includes('purse') ? 'bags'
        : text.includes('dress') || text.includes('kurta') || text.includes('saree') ? 'one-pieces'
          : text.includes('jean') || text.includes('pant') || text.includes('trouser') || text.includes('skirt') ? 'bottoms'
            : 'tops';

  return {
    id: `anakin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    price,
    imageUrl,
    category: category as Outfit['category'],
    sourceUrl,
    scrapedBy: 'anakin',
  };
}

// FIX 2 — Gemini image relevance check
async function isImageRelevant(imageUrl: string, searchQuery: string): Promise<boolean> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return true;
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imgRes.ok) return true;
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Does this image show a "${searchQuery}" clothing item? Answer ONLY "yes" or "no". Say "no" if it shows a completely different type of garment. Say "yes" if it's reasonably close.`,
    ]);

    const answer = result.response.text().toLowerCase().trim();
    return answer.startsWith('yes');
  } catch {
    return true;
  }
}

async function scrapeUrl(url: string, apiKey: string): Promise<{ markdown: string; html: string }> {
  const startRes = await fetch(`${ANAKIN_BASE}/url-scraper`, {
    method: 'POST',
    headers: anakinHeaders(apiKey),
    body: JSON.stringify({ url, formats: ['markdown', 'html'] }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!startRes.ok) throw new Error(`url-scraper failed ${startRes.status}`);

  const startData = await startRes.json() as {
    id?: string; jobId?: string; markdown?: string; html?: string; status?: string;
  };
  if (startData.markdown || startData.html) {
    return { markdown: startData.markdown ?? '', html: startData.html ?? '' };
  }

  const jobId = startData.jobId ?? startData.id;
  if (!jobId) throw new Error('No job id');

  for (let i = 0; i < 4; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await fetch(`${ANAKIN_BASE}/url-scraper/${jobId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!poll.ok) continue;
    const data = await poll.json() as { status?: string; markdown?: string; html?: string };
    if (data.status === 'completed' || data.markdown || data.html) {
      return { markdown: data.markdown ?? '', html: data.html ?? '' };
    }
    if (data.status === 'failed') throw new Error('url-scraper job failed');
  }
  throw new Error('url-scraper timed out');
}

// FIX 1 — better search query + specific sites
async function searchProductUrls(query: string, apiKey: string, altPhrase = false): Promise<string[]> {
  const searchQuery = altPhrase
    ? `buy ${query} online fashion India myntra ajio flipkart`
    : `${query} myntra OR ajio OR flipkart fashion India -saree -lehenga -ethnic`;

  const res = await fetch(`${ANAKIN_BASE}/search`, {
    method: 'POST',
    headers: anakinHeaders(apiKey),
    body: JSON.stringify({ prompt: searchQuery, limit: 8 }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return [];

  const data = await res.json() as { results?: Array<{ url?: string; link?: string }> };
  return (data.results ?? [])
    .map(r => r.url ?? r.link ?? '')
    .filter(u => u.startsWith('http') && (
      u.includes('myntra.com') ||
      u.includes('ajio.com') ||
      u.includes('flipkart.com') ||
      u.includes('amazon.in')
    ))
    .slice(0, 4);
}

// Curated fallback catalog — used when search returns no fashion-site URLs
const FALLBACK_CATALOG: Record<string, string[]> = {
  tshirt: [
    'https://www.myntra.com/tshirts/bewakoof/bewakoof-men-black-solid-round-neck-pure-cotton-t-shirt/12401006/buy',
    'https://www.myntra.com/tshirts/campus-sutra/campus-sutra-men-white-solid-round-neck-t-shirt/11908474/buy',
  ],
  shirt: [
    'https://www.myntra.com/shirts/arrow/arrow-men-slim-fit-solid-formal-shirt/16192870/buy',
  ],
  kurta: [
    'https://www.myntra.com/kurta-sets/khushalk/khushal-k-ethnic-motifs-embroidered-sequined-kurta-with-palazzos--dupatta/22120556/buy',
    'https://www.myntra.com/kurtas/libas/libas-women-blue-floral-printed-kurta/14108776/buy',
  ],
  dress: [
    'https://www.myntra.com/dresses/only/only-women-black-solid-a-line-dress/13544356/buy',
  ],
  jeans: [
    'https://www.myntra.com/jeans/levi%27s/levis-men-blue-slim-fit-stretchable-jeans/12354280/buy',
  ],
  sneaker: [
    'https://www.myntra.com/sports-shoes/puma/puma-men-white-one8-virat-kohli-running-shoes/14562818/buy',
  ],
  jacket: [
    'https://www.myntra.com/jackets/roadster/roadster-men-navy-blue-solid-denim-jacket/16192892/buy',
  ],
};

function getFallbackUrls(query: string): string[] {
  const q = query.toLowerCase();
  for (const [keyword, urls] of Object.entries(FALLBACK_CATALOG)) {
    if (q.includes(keyword)) return urls;
  }
  return FALLBACK_CATALOG.tshirt;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.ANAKIN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANAKIN_API_KEY not configured', products: [] });

  try {
    const body = await req.json() as { query?: string; url?: string };
    const originalQuery = body.query ?? '';
    const products: Outfit[] = [];

    let urlsToScrape: string[] = [];

    if (body.url) {
      urlsToScrape = [body.url];
    } else {
      // FIX 1: search with specific query
      urlsToScrape = await searchProductUrls(originalQuery, apiKey);

      // FIX 6: fallback to curated URLs if search returns nothing useful
      if (urlsToScrape.length === 0) {
        urlsToScrape = getFallbackUrls(originalQuery);
      }
    }

    await Promise.allSettled(
      urlsToScrape.map(async (url) => {
        try {
          const { markdown, html } = await scrapeUrl(url, apiKey);
          const product = parseProduct(markdown, html, url, originalQuery);
          if (!product) return;

          // FIX 2: Gemini relevance check (only for query searches, not direct URLs)
          if (!body.url && originalQuery) {
            const relevant = await isImageRelevant(product.imageUrl, originalQuery);
            if (!relevant) return;
          }

          products.push(product);
        } catch (e) {
          console.error('[scrape] failed for', url, e);
        }
      })
    );

    // MOCK FALLBACK: if still empty, return a guaranteed mock item so UI doesn't break
    if (products.length === 0) {
      const q = (originalQuery || '').toLowerCase();
      let img = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1000'; // Default
      if (q.includes('jean') || q.includes('denim') || q.includes('pant')) img = 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000'; // Jeans
      else if (q.includes('sneaker') || q.includes('shoe')) img = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000'; // Sneaker
      else if (q.includes('dress')) img = 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000'; // Dress
      else if (q.includes('jacket') || q.includes('coat')) img = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000'; // Jacket
      else if (q.includes('shirt') || q.includes('top')) img = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000'; // T-shirt

      products.push({
        id: `mock-${Date.now()}`,
        name: `${originalQuery || 'Item'} (Fallback)`,
        price: 999,
        imageUrl: img,
        category: q.includes('shoe') ? 'shoes' : q.includes('pant') || q.includes('jean') ? 'bottoms' : 'tops',
        sourceUrl: 'https://myntra.com',
        scrapedBy: 'mock',
      });
    }

    return NextResponse.json({ products });
  } catch (e) {
    console.error('[scrape] route error:', e);
    return NextResponse.json({ products: [] });
  }
}
