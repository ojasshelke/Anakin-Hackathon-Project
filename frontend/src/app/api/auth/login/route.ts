/**
 * POST /api/auth/login
 * Signs in an existing user via Supabase Auth email/password.
 * Returns: { access_token, refresh_token, expires_at, user: { id, email } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars are not configured');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

interface LoginBody {
  email: string;
  password: string;
}

function isLoginBody(value: unknown): value is LoginBody {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.email === 'string' && typeof v.password === 'string';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isLoginBody(body)) {
    return NextResponse.json(
      { error: 'email and password are required' },
      { status: 422 }
    );
  }

  const { email, password } = body;

  const supabase = getAnonSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? 'Invalid credentials' },
      { status: 401 }
    );
  }

  const { session } = data;

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
