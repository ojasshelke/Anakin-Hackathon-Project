'use client';

import { useState, useEffect } from 'react';
import type { ProductCategory } from '@/types';

interface UseClothingGlbResult {
  glbUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ClothingApiJson {
  glbUrl?: string;
  error?: string;
}

export function useClothingGlb(
  productId: string | undefined,
  productImageUrl: string | undefined,
  category: ProductCategory = 'tops'
): UseClothingGlbResult {
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !productImageUrl) return;

    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = (taskId: string) => {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/clothing/status/${taskId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'ready' && data.glbUrl) {
            setGlbUrl(data.glbUrl);
            setIsLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else if (data.status === 'failed') {
            setError('Clothing generation failed');
            setIsLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 3000);
    };

    const generate = async () => {
      setIsLoading(true);
      setError(null);
      setGlbUrl(null);
      try {
        const res = await fetch('/api/clothing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            productImageUrl,
            category,
          }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to initiate clothing generation');
        }

        if (data.glbUrl) {
          setGlbUrl(data.glbUrl);
          setIsLoading(false);
        } else if (data.taskId) {
          // Task initiated, start polling
          startPolling(data.taskId);
        } else {
          throw new Error('Invalid response from clothing API');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    void generate();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [productId, productImageUrl, category]);

  return { glbUrl, isLoading, error };
}
