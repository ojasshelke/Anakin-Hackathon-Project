import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // We can do counts in parallel
    const [keysResult, tryonsResult, usersResult] = await Promise.all([
      supabase.from('api_keys').select('*', { count: 'exact', head: true }),
      supabase.from('tryon_results').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ]);

    // usage_logs in current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: usageThisMonth } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startOfMonth.toISOString());

    return NextResponse.json({
      total_keys: keysResult.count || 0,
      total_tryons: tryonsResult.count || 0,
      total_users: usersResult.count || 0,
      usage_this_month: usageThisMonth || 0,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
