'use client';

/**
 * useUser.ts
 * Subscribes to the Supabase auth session and fetches the user's measurements
 * from the `users` table. Returns null if not logged in.
 *
 * RULE: "use client" – uses React state and effects.
 * RULE: Measurement data is PII – never logged.
 */

import { useState, useEffect } from 'react';
import type { UserRow } from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface UserWithMeasurements extends UserRow {
  /** Convenience alias for the Supabase Auth user id (same as UserRow.id) */
  authId: string;
}

interface UseUserState {
  user: UserWithMeasurements | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUser(authUserId: string, email: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        // Row may not exist yet right after signup — use auth data as fallback
        const fallback: UserWithMeasurements = {
          id: authUserId,
          authId: authUserId,
          email,
          height: null,
          chest: null,
          waist: null,
          hips: null,
          inseam: null,
          shoulder_width: null,
          avatar_url: null,
          face_texture_url: null,
          marketplace_id: null,
          created_at: new Date().toISOString(),
        };
        setState({ user: fallback, isLoading: false, error: null });
        return;
      }

      const row = data as UserRow;
      setState({
        user: { ...row, authId: authUserId },
        isLoading: false,
        error: null,
      });
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session?.user) {
        setState({ user: null, isLoading: false, error: null });
        return;
      }
      loadUser(session.user.id, session.user.email ?? '');
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session?.user) {
        setState({ user: null, isLoading: false, error: null });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      loadUser(session.user.id, session.user.email ?? '');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
