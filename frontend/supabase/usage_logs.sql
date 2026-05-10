-- Run in Supabase SQL editor
create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  endpoint text not null,
  user_id uuid, -- Optional if triggered by API key
  api_key_id uuid references api_keys(id),
  status_code integer,
  product_id text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists usage_logs_user_id_idx on usage_logs(user_id);
create index if not exists usage_logs_api_key_id_idx on usage_logs(api_key_id);

ALTER TABLE usage_logs
  ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys(id),
  ADD COLUMN IF NOT EXISTS status_code INTEGER;
