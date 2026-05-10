import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashApiKey } from '@/lib/crypto';
import { logAdminAction } from '@/lib/admin';

export async function POST(req: Request) {
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    const adminSecret = process.env.VEXA_ADMIN_KEY;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized — Admin token required' }, { status: 401 });
    }

    const body = await req.json();
    const { marketplace_name, monthly_limit } = body;

    if (!marketplace_name) {
      return NextResponse.json({ error: 'Missing marketplace_name' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 2. Generate raw key and marketplace_id
    const rawKey = `vexa_${crypto.randomUUID()}`;
    const marketplaceId = `mkt_${crypto.randomUUID().split('-')[0]}`;
    const hashedKey = await hashApiKey(rawKey);

    // 3. Store hashed key in DB
    const { error } = await supabase
      .from('api_keys')
      .insert({
        marketplace_id: marketplaceId,
        marketplace_name: marketplace_name,
        key_hash: hashedKey,
        monthly_limit: monthly_limit || 10000,
        call_count: 0,
        status: 'active'
      });

    if (error) {
      console.error("[/api/keys/generate] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Audit Log
    await logAdminAction('GENERATE_API_KEY', '/api/keys/generate', marketplaceId, { 
      marketplace_name, 
      monthly_limit 
    });

    // 5. Return raw key ONLY ONCE
    return NextResponse.json({
      marketplace_id: marketplaceId,
      marketplace_name: marketplace_name,
      api_key: rawKey,
      note: 'Save this key carefully. It will not be shown again.'
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

