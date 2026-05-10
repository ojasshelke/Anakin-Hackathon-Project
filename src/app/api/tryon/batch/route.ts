import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited } from '@/lib/rateLimit';
import { handleTryOn } from '../route';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (await isRateLimited(ip, 10)) {
    return NextResponse.json({ error: 'Too many requests. Please wait 60 seconds.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { userId, userPhotoUrl, products } = body;

    if (!userId || !userPhotoUrl || !products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!, { auth: { persistSession: false } });

    const results = [];
    let targetPhotoUrl = userPhotoUrl;

    // Handle base64 data URL at the start of the batch
    if (userPhotoUrl.startsWith('data:')) {
      try {
        const base64Data = userPhotoUrl.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `batch_base64_${userId}_${Date.now()}.png`;
          const storagePath = `uploads/${fileName}`;

          await supabase.storage
            .from('avatars')
            .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

          const { data: signedData } = await supabase.storage
            .from('avatars')
            .createSignedUrl(storagePath, 3600);
          
          if (signedData?.signedUrl) targetPhotoUrl = signedData.signedUrl;
        }
      } catch (e) {
        console.error('[/api/tryon/batch] Data URL conversion failed:', e);
      }
    }

    for (const product of products) {
      const { productId, productImageUrl } = product;

      // 1. Check cache
      const { data: cached } = await supabase
        .from('tryon_results')
        .select('result_url')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (cached?.result_url) {
        if (cached.result_url.startsWith('https://') || cached.result_url.startsWith('http://') || cached.result_url.startsWith('data:')) {
          results.push({ productId, resultUrl: cached.result_url, cached: true });
          continue;
        }

        // Sign the cached path
        const { data: signedData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(cached.result_url, 3600);
        
        if (signedData?.signedUrl) {
          results.push({ productId, resultUrl: signedData.signedUrl, cached: true });
          continue;
        }
      }

      try {
        const tryOnResult = await handleTryOn(
          {
            userId,
            productId,
            userPhotoUrl: targetPhotoUrl,
            productImageUrl,
          },
          supabase as any
        );

        results.push({ productId, resultUrl: tryOnResult.resultUrl, cached: tryOnResult.cached });
      } catch (e: unknown) {
        const err = e as Error;
        console.error(`Batch tryon failed for ${productId}:`, err);
      }
    }

    return NextResponse.json(results, { status: 200 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[/api/tryon/batch] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
