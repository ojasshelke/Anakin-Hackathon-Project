import { createClient } from '@supabase/supabase-js';

export async function logAdminAction(
  action: string,
  endpoint: string,
  targetId?: string,
  metadata?: Record<string, any>
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('[logAdminAction] Supabase config missing');
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await supabase.from('admin_logs').insert({
    action,
    endpoint,
    target_id: targetId,
    metadata,
  });

  if (error) {
    console.error('[logAdminAction] Failed to insert log:', error.message);
  }
}
