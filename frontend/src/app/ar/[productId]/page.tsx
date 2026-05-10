'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ARTryOn } from '@/components/ARTryOn';
import { useStore } from '@/store/useStore';
import { outfitLabelToClothingCategory } from '@/lib/clothingCategory';
import type { ARSessionRequestBody, ProductCategory, ClothingGlbApiResponse } from '@/types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400';

function parseClothingResponse(raw: unknown): ClothingGlbApiResponse | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    glbUrl: typeof o.glbUrl === 'string' ? o.glbUrl : undefined,
    cached: typeof o.cached === 'boolean' ? o.cached : undefined,
    error: typeof o.error === 'string' ? o.error : undefined,
  };
}

function ARPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useStore();

  const productIdParam = params.productId;
  const productId = Array.isArray(productIdParam)
    ? productIdParam[0]
    : productIdParam;

  const [clothingGlbUrl, setClothingGlbUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('Product');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setError('Missing product');
      setIsLoading(false);
      return;
    }

    const nameQ = searchParams.get('name');
    if (nameQ) {
      setProductName(nameQ);
    }

    const imageUrl = searchParams.get('imageUrl') ?? FALLBACK_IMAGE;
    const categoryRaw = searchParams.get('category') ?? 'tops';
    const category = outfitLabelToClothingCategory(categoryRaw);

    const load = async () => {
      try {
        const res = await fetch('/api/clothing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId,
            productImageUrl: imageUrl,
            category,
          }),
        });
        const raw: unknown = await res.json();
        const data = parseClothingResponse(raw);
        if (!res.ok) {
          throw new Error(data?.error ?? 'Failed to load clothing');
        }
        if (!data?.glbUrl) {
          throw new Error('No clothing GLB URL returned');
        }
        setClothingGlbUrl(data.glbUrl);

        if (currentUser?.id) {
          const body: ARSessionRequestBody = {
            userId: currentUser.id,
            productId: productId,
          };
          const logRes = await fetch('/api/ar/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (logRes.ok) {
            await logRes.json();
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [productId, searchParams, currentUser?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black gap-3">
        <Loader2 className="w-8 h-8 text-[#bef264] animate-spin" />
        <p className="text-white">Loading AR experience...</p>
      </div>
    );
  }

  if (error !== null || clothingGlbUrl === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4 px-6">
        <p className="text-rose-400 text-center">{error ?? 'Could not load clothing model'}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 rounded-xl bg-white/10 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <ARTryOn
      clothingGlbUrl={clothingGlbUrl}
      productName={productName}
      onClose={() => router.back()}
    />
  );
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-black gap-3">
          <Loader2 className="w-8 h-8 text-[#bef264] animate-spin" />
          <p className="text-white">Loading AR experience...</p>
        </div>
      }
    >
      <ARPageInner />
    </Suspense>
  );
}
