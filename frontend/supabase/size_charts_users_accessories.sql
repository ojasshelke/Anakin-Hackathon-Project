-- Run in Supabase SQL editor
alter table size_charts add column if not exists shoe_size_uk numeric;
alter table size_charts add column if not exists shoe_size_eu numeric;
alter table size_charts add column if not exists shoe_size_us numeric;
alter table size_charts add column if not exists foot_length_cm numeric;
alter table size_charts add column if not exists category text default 'clothing'
  check (category in ('clothing','shoes','hats','jewelry','bags'));

alter table users add column if not exists foot_length_cm numeric;
alter table users add column if not exists head_circumference_cm numeric;
alter table users add column if not exists finger_size_mm numeric;
