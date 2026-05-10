-- Run in Supabase SQL editor (or via migration tooling)
create table if not exists clothing_assets (
  id uuid default gen_random_uuid() primary key,
  product_id text not null unique,
  product_image_url text not null,
  glb_url text not null,
  category text not null check (category in ('tops','bottoms','dresses','outerwear','shoes','accessories')),
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists clothing_assets_product_id_idx
  on clothing_assets(product_id);
