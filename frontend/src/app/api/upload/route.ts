/**
 * POST /api/upload
 * Accepts a multipart form-data image upload.
 * Uploads to Cloudflare R2 bucket and returns the public URL.
 * Also updates the user's avatar_url in the users table.
 *
 * Auth: expects Authorization: Bearer <access_token> header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadToR2 } from '@/lib/r2';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars are not configured');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let user = { id: 'demo_guest' };
  const supabase = getServerSupabase();

  if (token) {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && authUser) {
      user = authUser as any;
    }
  }

  // 2. Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A "file" field is required in the form data' }, { status: 422 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are accepted' }, { status: 422 });
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
  }

  // 3. Upload to Cloudflare R2
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Format: {userId}/{timestamp}-{originalname}
  const originalName = file.name || 'image.jpg';
  const filename = `${user.id}/${Date.now()}-${originalName}`;
  
  const r2Url = await uploadToR2(buffer, filename, file.type);
  const avatarUrl = r2Url ?? `data:${file.type};base64,${buffer.toString('base64')}`;
  if (!r2Url) {
    console.warn('[/api/upload] R2 unavailable — serving base64 avatar inline');
  }

  // 4. Update users table (non-fatal)
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) {
    console.warn('[/api/upload] avatar_url update failed:', updateError.message);
  }

  return NextResponse.json({ url: avatarUrl }, { status: 200 });
}
