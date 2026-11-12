-- Portfolio Maker: tables, security rules and image storage.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again; existing objects are kept.

-- ---------------------------------------------------------------------------
-- Profiles: one row per account, created automatically on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Portfolios: `doc` is the working copy, `published_doc` is what visitors see.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled portfolio' check (char_length(title) between 1 and 120),
  slug text unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$'),
  doc jsonb not null,
  published_doc jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolios_user_id_idx on public.portfolios (user_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists portfolios_touch_updated_at on public.portfolios;
create trigger portfolios_touch_updated_at
  before update on public.portfolios
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Assets: one row per uploaded image.
-- ---------------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  portfolio_id uuid references public.portfolios (id) on delete set null,
  path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  size integer not null check (size > 0),
  created_at timestamptz not null default now()
);

create index if not exists assets_user_id_idx on public.assets (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Onboarding answers: kept to improve the starter ideas later.
-- ---------------------------------------------------------------------------
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  portfolio_id uuid references public.portfolios (id) on delete set null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security: an account can only see and change its own rows.
-- Published pages are read by the server in Phase 5, not through these rules.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.assets enable row level security;
alter table public.onboarding_answers enable row level security;

drop policy if exists "Own profile: read" on public.profiles;
create policy "Own profile: read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Own profile: update" on public.profiles;
create policy "Own profile: update" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Own portfolios: all" on public.portfolios;
create policy "Own portfolios: all" on public.portfolios
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Own assets: all" on public.assets;
create policy "Own assets: all" on public.assets
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Own answers: all" on public.onboarding_answers;
create policy "Own answers: all" on public.onboarding_answers
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A free account cannot change its own plan.
revoke update on public.profiles from authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Image storage: a public bucket. Each account writes only inside its own folder,
-- named after its user id. Images only, 5 MB at most.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-images', 'portfolio-images', true, 5242880, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio images: upload to own folder" on storage.objects;
create policy "Portfolio images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Portfolio images: delete own" on storage.objects;
create policy "Portfolio images: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
