-- Run in Supabase SQL editor
CREATE OR REPLACE FUNCTION increment_api_key_usage(key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET call_count = call_count + 1,
      last_used_at = NOW()
  WHERE id = key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
