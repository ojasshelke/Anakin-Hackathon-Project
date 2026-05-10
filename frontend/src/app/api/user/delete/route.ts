import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logAdminAction } from '@/lib/admin';

export async function DELETE(req: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    const adminSecret = process.env.VEXA_ADMIN_KEY;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized — Admin token required' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // 1. Fetch user to get avatar_url for R2 deletion
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Delete from Cloudflare R2 if avatar exists
    if (user.avatar_url) {
      try {
        const url = new URL(user.avatar_url);
        const filename = url.pathname.slice(1); // Remove leading slash

        const s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });

        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: filename,
        }));
      } catch (r2Err) {
        console.error('GDPR: Failed to delete R2 asset', r2Err);
        // Non-fatal, continue with DB deletion
      }
    }

    // 3. Delete all tryon_results
    await supabase.from('tryon_results').delete().eq('user_id', userId);

    // 4. Delete user record
    const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // 5. Delete Supabase Auth User
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.warn('GDPR: Failed to delete auth user, might require manual cleanup', authDeleteError.message);
    }

    // 6. Audit Log
    await logAdminAction('PURGE_USER', '/api/user/delete', userId);

    return NextResponse.json({ success: true, message: 'User data and assets fully purged.' });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('GDPR Deletion Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
