-- Portfolio Maker: newsletter sign-ups in the inbox, custom domains for Pro, and an error log.
-- Run after 0005_reports.sql, in the Supabase SQL editor. Safe to run again.

-- ---------------------------------------------------------------------------
-- Newsletter sign-ups. The newsletter section of a published page sends here when the owner has
-- not entered their own mailing list address. One row per address and page.
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200),
  created_at timestamptz not null default now(),
  unique (portfolio_id, email)
);

create index if not exists newsletter_signups_portfolio_idx
  on public.newsletter_signups (portfolio_id, created_at desc);

alter table public.newsletter_signups enable row level security;

drop policy if exists "Own sign-ups: read" on public.newsletter_signups;
create policy "Own sign-ups: read" on public.newsletter_signups
  for select to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

drop policy if exists "Own sign-ups: delete" on public.newsletter_signups;
create policy "Own sign-ups: delete" on public.newsletter_signups
  for delete to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

revoke insert, update on public.newsletter_signups from anon, authenticated;

-- Visitors sign up only through this function: published pages only, 30 sign-ups an hour at most.
-- Signing up twice with the same address is accepted and keeps one row.
create or replace function public.submit_newsletter_signup(p_slug text, p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  address text := lower(trim(coalesce(p_email, '')));
begin
  select p.id into target from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published';
  if target is null then
    return 'not_found';
  end if;
  if char_length(address) not between 3 and 200 or address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return 'invalid';
  end if;
  if (select count(*) from public.newsletter_signups s
      where s.portfolio_id = target and s.created_at > now() - interval '1 hour') >= 30 then
    return 'busy';
  end if;
  insert into public.newsletter_signups (portfolio_id, email)
  values (target, address)
  on conflict (portfolio_id, email) do nothing;
  return 'ok';
end;
$$;

revoke execute on function public.submit_newsletter_signup(text, text) from public;
grant execute on function public.submit_newsletter_signup(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Custom domains (Pro). The owner adds a domain for one of their pages; the server adds it to the
-- Vercel project and marks it verified once its DNS points at Vercel. Visitors to the domain see
-- the published page, as long as the owner is Pro.
-- ---------------------------------------------------------------------------
create table if not exists public.custom_domains (
  domain text primary key
    check (char_length(domain) <= 253
      and domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'),
  portfolio_id uuid not null unique references public.portfolios (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.custom_domains enable row level security;

drop policy if exists "Own domains: read" on public.custom_domains;
create policy "Own domains: read" on public.custom_domains
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Only Pro accounts add domains, only for their own portfolios, and never already verified.
drop policy if exists "Own domains: add when Pro" on public.custom_domains;
create policy "Own domains: add when Pro" on public.custom_domains
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and verified = false
    and public.is_pro((select auth.uid()))
    and exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "Own domains: remove" on public.custom_domains;
create policy "Own domains: remove" on public.custom_domains
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Only the server (after asking Vercel) marks a domain verified.
revoke update on public.custom_domains from anon, authenticated;
revoke all on public.custom_domains from anon;

-- Which page a domain shows. Empty when the domain is unknown, not verified, the page is not
-- published, or the owner is no longer Pro.
create or replace function public.resolve_custom_domain(p_domain text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.slug
  from public.custom_domains d
  join public.portfolios p on p.id = d.portfolio_id
  where d.domain = lower(trim(p_domain))
    and d.verified
    and p.status = 'published'
    and public.is_pro(p.user_id)
  limit 1;
$$;

revoke execute on function public.resolve_custom_domain(text) from public;
grant execute on function public.resolve_custom_domain(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Server errors, written by the app with the secret key. Nobody reads them through the API; the
-- project owner reads them in the dashboard:
--   select * from public.error_log order by created_at desc limit 50;
-- The daily job removes rows older than 30 days.
-- ---------------------------------------------------------------------------
create table if not exists public.error_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  message text not null check (char_length(message) <= 2000),
  digest text not null default '' check (char_length(digest) <= 200),
  path text not null default '' check (char_length(path) <= 500),
  kind text not null default '' check (char_length(kind) <= 50)
);

create index if not exists error_log_created_idx on public.error_log (created_at desc);

alter table public.error_log enable row level security;
revoke all on public.error_log from anon, authenticated;
