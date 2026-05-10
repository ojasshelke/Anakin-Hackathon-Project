/**
 * Supabase Storage bucket for studio uploads and try-on PNGs.
 * Create this bucket in Supabase Dashboard → Storage (name must match).
 * For public result URLs, mark the bucket public or add a read policy for `tryons/` and `studio_uploads/`.
 */
export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'avatars';
}

export function storageBucketNotFoundHint(bucket: string, message: string): string {
  if (!/bucket not found|not found/i.test(message)) return '';
  return ` In Supabase: Storage → New bucket → name it "${bucket}" (or set SUPABASE_STORAGE_BUCKET to an existing bucket). Enable public access if try-on image URLs must load without auth.`;
}
