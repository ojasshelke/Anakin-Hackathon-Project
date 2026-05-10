"use client";

/**
 * useTryOn.ts
 * Loads a clothing GLB and prepares draping state for R3F scene.
 * Hits /api/tryon/[productId] then loads the signed render GLB.
 *
 * RULE: "use client" — R3F hooks require client context.
 * RULE: No raw GLB paths — always use signed URLs from API.
 * RULE: Auth header is Bearer token matching [productId]/route.ts validation.
 */

import { useState, useCallback } from 'react';
import type { TryOnResult } from '@/types';

interface UseTryOnOptions {
  userId: string;
  /** Access token sent as Bearer token in Authorization header */
  apiKey: string;
}

export interface UseTryOnState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  result: TryOnResult | null;
  error: string | null;
}

export function useTryOn(opts: UseTryOnOptions): UseTryOnState & {
  triggerTryOn: (productId: string, avatarGlbUrl: string, clothingGlbUrl: string) => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<UseTryOnState>({
    status: 'idle',
    result: null,
    error: null,
  });

  const triggerTryOn = useCallback(
    async (productId: string, avatarGlbUrl: string, clothingGlbUrl: string) => {
      setState({ status: 'loading', result: null, error: null });

      try {
        const res = await fetch(`/api/tryon/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Bearer token auth — matches [productId]/route.ts validation
            'Authorization': `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({
            userId: opts.userId,
            avatarGlbUrl,
            clothingGlbUrl,
          }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? `Try-on failed: ${res.status}`);
        }

        const result = (await res.json()) as TryOnResult;
        setState({ status: 'ready', result, error: null });
      } catch (err: unknown) {
        setState({
          status: 'error',
          result: null,
          error: err instanceof Error ? err.message : 'Try-on failed',
        });
      }
    },
    [opts.userId, opts.apiKey]
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', result: null, error: null });
  }, []);

  return { ...state, triggerTryOn, reset };
}
