import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFitRecommendation } from '@/lib/fitEngine';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const supabase = getServerSupabase();

    let authedUserId: string | null = null;
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authedUserId = user.id;
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, productId } = body as { userId?: string; productId?: string };

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 });
    }
    if (authedUserId && userId !== authedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: sizeChart, error: sizeError } = await supabase
      .from('size_charts')
      .select('*')
      .eq('product_id', productId);

    if (sizeError) {
      console.error('[/api/size] Error fetching size chart:', sizeError.message);
    }

    const { fitLabel, recommendedSize } = getFitRecommendation(userRow, sizeChart || []);

    return NextResponse.json({ fitLabel, recommendedSize }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[/api/size] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
