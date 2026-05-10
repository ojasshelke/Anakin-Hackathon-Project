"use client";

/**
 * useAvatar.ts
 * Polls /api/avatar/[userId] until status === "ready", then returns the signed GLB URL.
 *
 * RULE: "use client" — hooks using React state/effects must be client components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AvatarStatus } from '@/types';

const DEFAULT_POLL_INTERVAL = 2000; // 2s
const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 minutes timeout

interface UseAvatarOptions {
  /** Polling interval in ms */
  pollIntervalMs?: number;
  /** API key to attach to requests */
  apiKey: string;
  /** Whether to start polling immediately */
  enabled?: boolean;
}

export interface UseAvatarState {
  status: AvatarStatus | 'not_found' | 'idle' | 'timeout';
  glbUrl: string | null;
  progress: number;
  error: string | null;
  isLoading: boolean;
}

export function useAvatar(
  userId: string | null,
  options: UseAvatarOptions
): UseAvatarState & { refetch: () => void } {
  const { pollIntervalMs = DEFAULT_POLL_INTERVAL, apiKey, enabled = true } = options;

  const [state, setState] = useState<UseAvatarState>({
    status: 'idle',
    glbUrl: null,
    progress: 0,
    error: null,
    isLoading: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/avatar/${userId}`, {
        headers: { 'x-vexa-key': apiKey },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 404) {
          setState((prev) => ({ ...prev, status: 'not_found', isLoading: false }));
          clearPolling();
          return;
        }
        throw new Error(`Poll failed: ${res.status}`);
      }

      const data = (await res.json()) as {
        status: AvatarStatus;
        glbUrl?: string;
        progress?: number;
        error?: string;
      };

      // Check timeout
      if (startTimeRef.current && Date.now() - startTimeRef.current > MAX_POLL_DURATION) {
        clearPolling();
        setState((prev) => ({ ...prev, status: 'timeout', isLoading: false }));
        return;
      }

      if (data.status === 'ready') {
        clearPolling();
        setState({
          status: 'ready',
          glbUrl: data.glbUrl ?? null,
          progress: 100,
          error: null,
          isLoading: false,
        });
      } else if (data.status === 'error') {
        clearPolling();
        setState({
          status: 'error',
          glbUrl: null,
          progress: 0,
          error: data.error ?? 'Avatar generation failed',
          isLoading: false,
        });
      } else {
        setState((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress ?? prev.progress,
          isLoading: true,
        }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      }));
    }
  }, [userId, apiKey, clearPolling]);

  const startPolling = useCallback(() => {
    clearPolling();
    if (!userId || !enabled) return;

    startTimeRef.current = Date.now();
    setState((prev) => ({ ...prev, isLoading: true, status: 'queued', error: null }));

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, pollIntervalMs);
  }, [userId, enabled, fetchStatus, clearPolling, pollIntervalMs]);

  useEffect(() => {
    if (userId && enabled) {
      startPolling();
    }
    return clearPolling;
  }, [userId, enabled, startPolling, clearPolling]);

  return { ...state, refetch: startPolling };
}
