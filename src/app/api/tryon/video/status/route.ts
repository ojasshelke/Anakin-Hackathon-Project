import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VideoJobStatus, VideoJobStatusResponse } from '@/types';

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL or key not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

interface VideoJobStatusRow {
  status: VideoJobStatus;
  progress_percent: number | null;
  result_video_url: string | null;
  error_message: string | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId query param' },
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

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('video_jobs')
      .select('user_id, status, progress_percent, result_video_url, error_message')
      .eq('id', jobId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (data.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot access video tryon for another user' }, { status: 403 });
    }

    const row = data as VideoJobStatusRow;
    const payload: VideoJobStatusResponse = {
      status: row.status,
      progressPercent: row.progress_percent ?? 0,
      resultVideoUrl: row.result_video_url ?? null,
      errorMessage: row.error_message ?? null,
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
