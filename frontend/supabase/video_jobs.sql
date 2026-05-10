-- Run in Supabase SQL editor
create table if not exists video_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  product_id text not null,
  input_video_url text not null,
  product_image_url text not null,
  status text not null default 'processing'
    check (status in ('processing','completed','failed')),
  progress_percent integer default 0,
  result_video_url text,
  error_message text,
  created_at timestamp with time zone default timezone('utc', now())
);
