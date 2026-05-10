/**
 * POST /api/auth/signup
 * Creates a Supabase Auth user and inserts body measurements into the users table.
 * Returns: { id, email }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Never expose this key to the browser.
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars are not configured');
  }

  // No Database generic here — the generic requires Supabase's generated types
  // which we manage separately via src/types/database.ts for browser clients.
  return createClient(url, key, { auth: { persistSession: false } });
}

interface SignupBody {
  email: string;
  password: string;
  height: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  shoulder_width: number;
}

function isSignupBody(value: unknown): value is SignupBody {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.email === 'string' &&
    typeof v.password === 'string' &&
    typeof v.height === 'number' &&
    typeof v.chest === 'number' &&
    typeof v.waist === 'number' &&
    typeof v.hips === 'number' &&
    typeof v.inseam === 'number' &&
    typeof v.shoulder_width === 'number'
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isSignupBody(body)) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid fields. Required: email, password, height, chest, waist, hips, inseam, shoulder_width (all numeric except email/password)',
      },
      { status: 422 }
    );
  }

  const { email, password, height, chest, waist, hips, inseam, shoulder_width } = body;

  const supabase = getServerSupabase();

  // 1. Create auth user (admin API — skips email confirmation)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create user' },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  // 2. Insert measurements into users table
  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    email,
    height,
    chest,
    waist,
    hips,
    inseam,
    shoulder_width,
    avatar_url: null,
    face_texture_url: null,
  });

  if (insertError) {
    // Rollback: delete the auth user to keep auth + DB in sync
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: insertError.message ?? 'Failed to save measurements' },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: userId, email }, { status: 201 });
}
