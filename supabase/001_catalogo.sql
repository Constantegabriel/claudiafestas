-- Catálogo · estrutura do banco
-- Rode este arquivo no Supabase: SQL Editor → New query → colar → Run.
-- Pode rodar de novo sem problema (não apaga dados).

-- Produtos ------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null default '',
  category         text not null default '',
  price            numeric(10,2),                       -- null = sob consulta
  images           jsonb not null default '[]'::jsonb,  -- ["https://...jpg", ...]
  variation_label  text not null default '',            -- ex.: "Tamanho"
  variations       jsonb not null default '[]'::jsonb,  -- [{ id, name, price }]
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.products enable row level security;

-- Visitantes veem os produtos ativos; quem está logado (admin) vê todos.
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (active or auth.role() = 'authenticated');

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated using (true) with check (true);

-- Configurações da loja (uma linha só) ---------------------------------------
create table if not exists public.settings (
  id          int primary key default 1 check (id = 1),
  store_name  text not null default 'Claudia Festas',
  whatsapp    text not null default '',
  tagline     text not null default ''
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all to authenticated using (true) with check (true);

-- Fotos (Storage) -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "produtos_admin_insert" on storage.objects;
create policy "produtos_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos');

drop policy if exists "produtos_admin_delete" on storage.objects;
create policy "produtos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'produtos');
