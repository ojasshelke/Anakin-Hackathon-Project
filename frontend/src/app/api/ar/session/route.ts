import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ARSessionRequestBody, ARSessionResponse } from '@/types';

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL or key not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseBody(raw: unknown): ARSessionRequestBody | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const userId = o.userId;
  const productId = o.productId;
  if (typeof userId !== 'string' || userId.length === 0) return null;
  if (typeof productId !== 'string' || productId.length === 0) return null;
  return { userId, productId };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = parseBody(parsed);
    if (!body) {
      return NextResponse.json(
        { error: 'Missing userId or productId' },
        { status: 400 }
      );
    }

    // 1. Authentication Check (Bearer Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. IDOR Prevention: verify user is requesting session for themselves
    if (body.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot create AR session for another user' }, { status: 403 });
    }

    const supabase = getSupabase();

    try {
      const { error: insertError } = await supabase.from('usage_logs').insert({
        api_key_id: null,
        endpoint: 'ar_session',
        status: 200,
        response_time_ms: 0
      });

      if (insertError) {
        console.warn('[/api/ar/session] usage_logs insert:', insertError.message);
      }
    } catch (e) {
      console.warn('[/api/ar/session] usage_logs insert threw:', e);
    }

    const sessionToken = `ar_${crypto.randomUUID()}`;
    const payload: ARSessionResponse = {
      sessionToken: sessionToken,
      message: 'AR session started',
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
