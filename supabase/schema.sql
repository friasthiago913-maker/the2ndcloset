-- Ejecutar esto en Supabase → SQL Editor (una sola vez)

create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price integer not null,
  condition text not null default '10/10',
  details text default '',
  images text[] not null default '{}',
  sold boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

drop policy if exists "public_read_products" on products;
create policy "public_read_products" on products
  for select using (true);

drop policy if exists "auth_write_products" on products;
create policy "auth_write_products" on products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage: bucket público para las fotos que subas desde el panel
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public_read_images" on storage.objects;
create policy "public_read_images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "auth_upload_images" on storage.objects;
create policy "auth_upload_images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "auth_delete_images" on storage.objects;
create policy "auth_delete_images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
