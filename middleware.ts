import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashApiKey } from '@/lib/crypto';

export async function middleware(req: NextRequest) {
  // If the route is /api/keys/..., let it pass so the dashboard can generate/list keys
  if (req.nextUrl.pathname.startsWith('/api/keys')) {
    return NextResponse.next();
  }

  const apiKeyHeader = req.headers.get('x-vexa-key');
  
  if (!apiKeyHeader) {
    // Demo Mode Bypass: Allow access without key for demo
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Query Supabase api_keys table
  const hashedKey = await hashApiKey(apiKeyHeader);
  const { data: keyRecord, error: keyError } = await supabase
    .from('api_keys')
    .select('id, status, call_count, monthly_limit')
    .eq('key_hash', hashedKey)
    .single();

  if (keyError || !keyRecord || keyRecord.status !== 'active') {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (keyRecord.call_count >= keyRecord.monthly_limit) {
    return NextResponse.json({ error: "Monthly limit exceeded" }, { status: 429 });
  }

  // Increment call_count by 1
  const newCount = keyRecord.call_count + 1;
  await supabase
    .from('api_keys')
    .update({ call_count: newCount })
    .eq('id', keyRecord.id);

  // Insert row into usage_logs
  // status: 200 is hardcoded as per instructions, but realistically it's before the actual request completes
  await supabase
    .from('usage_logs')
    .insert({
      api_key_id: keyRecord.id,
      endpoint: req.nextUrl.pathname,
      status: 200,
      response_time_ms: 0,
      timestamp: new Date().toISOString()
    });

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
