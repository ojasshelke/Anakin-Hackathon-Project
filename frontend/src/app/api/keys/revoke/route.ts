import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    const adminSecret = process.env.VEXA_ADMIN_KEY;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized — Admin token required' }, { status: 401 });
    }

    const body = await req.json();
    const { key_id } = body;

    if (!key_id) {
      return NextResponse.json({ error: 'key_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', key_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Audit Log
    await logAdminAction('REVOKE_API_KEY', '/api/keys/revoke', key_id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

