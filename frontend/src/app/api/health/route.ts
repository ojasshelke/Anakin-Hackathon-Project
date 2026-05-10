import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const timestamp = new Date().toISOString();
  let supabaseStatus = false;
  let avatarServiceStatus = false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('api_keys').select('id').limit(1);
    supabaseStatus = !error;
  } catch (e) {
    console.error('Health check: Supabase ping failed', e);
  }

  try {
    const avatarServiceUrl = process.env.AVATAR_SERVICE_URL;
    if (avatarServiceUrl) {
      const res = await fetch(`${avatarServiceUrl}/`, { method: 'GET' });
      avatarServiceStatus = res.ok;
    }
  } catch (e) {
    console.error('Health check: Avatar service ping failed', e);
  }

  return NextResponse.json({
    status: (supabaseStatus && avatarServiceStatus) ? "ok" : "partial_failure",
    supabase: supabaseStatus,
    avatarService: avatarServiceStatus,
    timestamp
  });
}
