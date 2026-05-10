/**
 * GET /api/avatar/[userId]
 * Returns the avatar URL for the authenticated user.
 *
 * Auth: Supabase Bearer token. Users can only look up their own avatar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  try {
    const { userId } = await params;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.id !== userId) {
      return NextResponse.json({ status: 'error', error: 'Forbidden' }, { status: 403 });
    }

    const { data } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single() as { data: { avatar_url: string | null } | null };

    if (data?.avatar_url) {
      // Keep legacy `glbUrl` for existing consumers; add `avatarUrl` as canonical.
      return NextResponse.json({ status: 'ready', avatarUrl: data.avatar_url, glbUrl: data.avatar_url });
    }

    return NextResponse.json({ status: 'processing', progress: 50 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
