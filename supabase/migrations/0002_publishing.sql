-- Portfolio Maker: publishing, contact messages, view counts and version history.
-- Run after 0001_init.sql, in the Supabase SQL editor. Safe to run again.

-- ---------------------------------------------------------------------------
-- Publishing
-- ---------------------------------------------------------------------------
alter table public.portfolios add column if not exists published_at timestamptz;

-- Link names that would clash with pages of the app or look official.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_slug_not_reserved') then
    alter table public.portfolios add constraint portfolios_slug_not_reserved check (
      slug is null or slug not in (
        'admin', 'api', 'app', 'auth', 'dashboard', 'dev', 'editor', 'help', 'login', 'logout', 'new',
        'p', 'preview', 'pricing', 'privacy', 'settings', 'signup', 'support', 'terms', 'www'
      )
    );
  end if;
end;
$$;

-- What visitors see. Returns nothing unless the portfolio is published, and never the working copy.
create or replace function public.get_published_portfolio(p_slug text)
returns table (title text, doc jsonb, published_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, p.published_doc, p.published_at
  from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published' and p.published_doc is not null
  limit 1;
$$;

-- True when the link name is free, or already belongs to one of the caller's own portfolios.
create or replace function public.is_slug_available(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.portfolios p
    where p.slug = lower(p_slug) and p.user_id is distinct from (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Contact form messages
-- ---------------------------------------------------------------------------
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists form_submissions_portfolio_idx on public.form_submissions (portfolio_id, created_at desc);

alter table public.form_submissions enable row level security;

drop policy if exists "Own messages: read" on public.form_submissions;
create policy "Own messages: read" on public.form_submissions
  for select to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

drop policy if exists "Own messages: mark read" on public.form_submissions;
create policy "Own messages: mark read" on public.form_submissions
  for update to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

drop policy if exists "Own messages: delete" on public.form_submissions;
create policy "Own messages: delete" on public.form_submissions
  for delete to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

revoke update on public.form_submissions from authenticated;
grant update (is_read) on public.form_submissions to authenticated;

-- Visitors send messages only through this function: published pages only, 30 messages an hour at most.
create or replace function public.submit_contact_message(p_slug text, p_name text, p_email text, p_message text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select p.id into target from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published';
  if target is null then
    return 'not_found';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120
     or char_length(trim(coalesce(p_email, ''))) not between 3 and 200
     or position('@' in coalesce(p_email, '')) = 0
     or char_length(trim(coalesce(p_message, ''))) not between 1 and 5000 then
    return 'invalid';
  end if;
  if (select count(*) from public.form_submissions s
      where s.portfolio_id = target and s.created_at > now() - interval '1 hour') >= 30 then
    return 'busy';
  end if;
  insert into public.form_submissions (portfolio_id, name, email, message)
  values (target, trim(p_name), trim(p_email), trim(p_message));
  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- View counts: one row per portfolio per day
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  primary key (portfolio_id, day)
);

alter table public.page_views enable row level security;

drop policy if exists "Own views: read" on public.page_views;
create policy "Own views: read" on public.page_views
  for select to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));

create or replace function public.record_page_view(p_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.page_views (portfolio_id, day, views)
  select p.id, current_date, 1 from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published'
  on conflict (portfolio_id, day) do update set views = public.page_views.views + 1;
$$;

-- ---------------------------------------------------------------------------
-- Version history: saved copies of a portfolio, the newest 30 kept
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_versions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default '' check (char_length(label) <= 80),
  doc jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_versions_idx on public.portfolio_versions (portfolio_id, created_at desc);

alter table public.portfolio_versions enable row level security;

drop policy if exists "Own versions: all" on public.portfolio_versions;
create policy "Own versions: all" on public.portfolio_versions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))
  );

create or replace function public.trim_portfolio_versions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.portfolio_versions v
  where v.portfolio_id = new.portfolio_id
    and v.id not in (
      select k.id from public.portfolio_versions k
      where k.portfolio_id = new.portfolio_id
      order by k.created_at desc
      limit 30
    );
  return null;
end;
$$;

drop trigger if exists portfolio_versions_trim on public.portfolio_versions;
create trigger portfolio_versions_trim
  after insert on public.portfolio_versions
  for each row execute function public.trim_portfolio_versions();

-- ---------------------------------------------------------------------------
-- Who may call the functions
-- ---------------------------------------------------------------------------
revoke execute on function public.get_published_portfolio(text) from public;
revoke execute on function public.is_slug_available(text) from public;
revoke execute on function public.submit_contact_message(text, text, text, text) from public;
revoke execute on function public.record_page_view(text) from public;
revoke execute on function public.trim_portfolio_versions() from public;

grant execute on function public.get_published_portfolio(text) to anon, authenticated;
grant execute on function public.is_slug_available(text) to authenticated;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;
grant execute on function public.record_page_view(text) to anon, authenticated;
