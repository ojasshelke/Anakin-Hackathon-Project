import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashApiKey } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  try {
    const key = req.headers.get('x-vexa-key');

    if (!key) {
      // Demo Mode Bypass: If no key is provided, allow access for the demo
      return NextResponse.json({ valid: true, marketplace_name: 'VEXA Demo User' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ valid: false, error: 'Server configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const hashedKey = await hashApiKey(key);

    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('marketplace_name, status')
      .eq('key_hash', hashedKey)
      .single();

    if (error || !apiKeyRecord) {
      // Demo Mode Bypass: If key is not in DB, allow access for the demo
      return NextResponse.json({ valid: true, marketplace_name: 'VEXA Demo User' });
    }

    if (apiKeyRecord.status !== 'active') {
      return NextResponse.json({ valid: false, error: 'API key revoked or inactive' }, { status: 403 });
    }

    return NextResponse.json({ 
      valid: true, 
      marketplace_name: apiKeyRecord.marketplace_name 
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
