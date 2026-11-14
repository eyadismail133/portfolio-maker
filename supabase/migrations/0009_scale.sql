-- Portfolio Maker: keeps the database fast as it grows (backend audit, part 2, 14 November 2026).
-- Run after 0008_hardening.sql, in the Supabase SQL editor. Safe to run again.
--
-- 1. Messages, sign-ups and visit counts carry their page owner (`owner_id`), so the inbox and the
--    dashboard read one account's rows through an index instead of checking every row.
-- 2. Indexes for foreign keys and lookups that had none.
-- 3. Small functions so the app no longer downloads whole rows to count or check something:
--    unread_message_count() and published_languages().

-- ---------------------------------------------------------------------------
-- 1. Owner on messages, sign-ups and visit counts
-- ---------------------------------------------------------------------------
alter table public.form_submissions
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.newsletter_signups
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.page_views
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

update public.form_submissions s set owner_id = p.user_id
from public.portfolios p where p.id = s.portfolio_id and s.owner_id is distinct from p.user_id;
update public.newsletter_signups s set owner_id = p.user_id
from public.portfolios p where p.id = s.portfolio_id and s.owner_id is distinct from p.user_id;
update public.page_views s set owner_id = p.user_id
from public.portfolios p where p.id = s.portfolio_id and s.owner_id is distinct from p.user_id;

alter table public.form_submissions alter column owner_id set not null;
alter table public.newsletter_signups alter column owner_id set not null;
alter table public.page_views alter column owner_id set not null;

-- The owner always comes from the portfolio, never from whoever inserts the row. Visit counts
-- are written only by record_page_view, which sets it itself (a trigger there would run on
-- every visit).
create or replace function public.set_owner_from_portfolio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.user_id into new.owner_id from public.portfolios p where p.id = new.portfolio_id;
  return new;
end;
$$;

revoke execute on function public.set_owner_from_portfolio() from public, anon, authenticated;

drop trigger if exists form_submissions_owner on public.form_submissions;
create trigger form_submissions_owner
  before insert on public.form_submissions
  for each row execute function public.set_owner_from_portfolio();

drop trigger if exists newsletter_signups_owner on public.newsletter_signups;
create trigger newsletter_signups_owner
  before insert on public.newsletter_signups
  for each row execute function public.set_owner_from_portfolio();

create index if not exists form_submissions_owner_idx
  on public.form_submissions (owner_id, created_at desc);
create index if not exists form_submissions_owner_unread_idx
  on public.form_submissions (owner_id) where not is_read;
create index if not exists newsletter_signups_owner_idx
  on public.newsletter_signups (owner_id, created_at desc);
create index if not exists page_views_owner_day_idx
  on public.page_views (owner_id, day);

-- Simpler, faster rules: compare a column instead of looking up the portfolio for every row.
-- `(select ...)` makes Postgres work the value out once per query, not once per row.
drop policy if exists "Own messages: read" on public.form_submissions;
create policy "Own messages: read" on public.form_submissions
  for select to authenticated
  using (owner_id = (select auth.uid()) and (not locked or (select public.am_i_pro())));

drop policy if exists "Own messages: mark read" on public.form_submissions;
create policy "Own messages: mark read" on public.form_submissions
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Own messages: delete" on public.form_submissions;
create policy "Own messages: delete" on public.form_submissions
  for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Own sign-ups: read" on public.newsletter_signups;
create policy "Own sign-ups: read" on public.newsletter_signups
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Own sign-ups: delete" on public.newsletter_signups;
create policy "Own sign-ups: delete" on public.newsletter_signups
  for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Own views: read" on public.page_views;
create policy "Own views: read" on public.page_views
  for select to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.record_page_view(p_slug text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.page_views (portfolio_id, owner_id, day, shard, views)
  select p.id, p.user_id, current_date, floor(random() * 16)::smallint, 1 from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published'
  on conflict (portfolio_id, day, shard) do update set views = public.page_views.views + 1;
$$;

revoke execute on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;

create or replace function public.list_messages(p_limit integer default 200)
returns table (
  id uuid,
  portfolio_id uuid,
  name text,
  email text,
  message text,
  is_read boolean,
  locked boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id, public.is_pro((select auth.uid())) as pro)
  select
    s.id,
    s.portfolio_id,
    case when s.locked and not me.pro then '' else s.name end,
    case when s.locked and not me.pro then '' else s.email end,
    case when s.locked and not me.pro then '' else s.message end,
    s.is_read,
    s.locked,
    s.created_at
  from public.form_submissions s
  cross join me
  where s.owner_id = me.id
  order by s.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

revoke execute on function public.list_messages(integer) from public, anon;
grant execute on function public.list_messages(integer) to authenticated;

-- Same rules as 0004; the monthly count now uses the owner index.
create or replace function public.submit_contact_message(p_slug text, p_name text, p_email text, p_message text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  owner uuid;
  this_month integer;
begin
  select p.id, p.user_id into target, owner from public.portfolios p
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
  select count(*) into this_month
  from public.form_submissions s
  where s.owner_id = owner and s.created_at >= date_trunc('month', now());
  insert into public.form_submissions (portfolio_id, name, email, message, locked)
  values (target, trim(p_name), trim(p_email), trim(p_message), not public.is_pro(owner) and this_month >= 50);
  return 'ok';
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Indexes. Foreign keys without one make deleting a portfolio or an account read the whole
-- table; the others serve lookups that run often.
-- ---------------------------------------------------------------------------
create index if not exists assets_portfolio_id_idx
  on public.assets (portfolio_id) where portfolio_id is not null;
create index if not exists onboarding_answers_user_id_idx
  on public.onboarding_answers (user_id);
create index if not exists onboarding_answers_portfolio_id_idx
  on public.onboarding_answers (portfolio_id) where portfolio_id is not null;
create index if not exists portfolio_versions_user_id_idx
  on public.portfolio_versions (user_id);
create index if not exists custom_domains_user_id_idx
  on public.custom_domains (user_id);
create index if not exists abuse_reports_portfolio_id_idx
  on public.abuse_reports (portfolio_id) where portfolio_id is not null;
-- The hourly limit in submit_abuse_report.
create index if not exists abuse_reports_slug_created_idx
  on public.abuse_reports (slug, created_at desc);
-- The daily "Pro ends in 3 days" job.
create index if not exists profiles_pro_until_idx
  on public.profiles (pro_until) where plan = 'pro';

-- ---------------------------------------------------------------------------
-- 3. Small answers instead of whole rows
-- ---------------------------------------------------------------------------
-- The dashboard's unread badge. Counts locked messages too: they are waiting for the owner.
create or replace function public.unread_message_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.form_submissions s
  where s.owner_id = (select auth.uid()) and not s.is_read;
$$;

revoke execute on function public.unread_message_count() from public, anon;
grant execute on function public.unread_message_count() to authenticated;

-- The languages of a published page, or null when there is no published page with this link
-- name. Used on every visit before the page is drawn, so it returns a few bytes, not the page.
create or replace function public.published_languages(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.published_doc -> 'meta' -> 'languages', '[]'::jsonb)
  from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published' and p.published_doc is not null
  limit 1;
$$;

revoke execute on function public.published_languages(text) from public;
grant execute on function public.published_languages(text) to anon, authenticated;
