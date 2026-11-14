-- Portfolio Maker: closes gaps found in the backend audit (14 November 2026).
-- Run after 0007_publish_replacing.sql, in the Supabase SQL editor. Safe to run again.
--
-- 1. Image storage is measured from the stored files, not from rows the browser writes.
-- 2. Locked messages (after Free's 50 a month) can no longer be read through the API.
-- 3. Portfolio documents and saved versions have a size limit.
-- 4. Plan limits and "Replace my live page" cannot be beaten by sending requests at the same time.
-- 5. Only the account itself can ask whether it is Pro.
-- 6. Visit counts are spread over 16 rows per page and day, so busy pages do not queue up.

-- ---------------------------------------------------------------------------
-- 5 (first, because later parts use it). The caller's own Pro state. `is_pro(uuid)` stays for the
-- database's own functions but accounts can no longer ask about other accounts.
-- ---------------------------------------------------------------------------
create or replace function public.am_i_pro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_pro((select auth.uid()));
$$;

revoke execute on function public.am_i_pro() from public, anon;
grant execute on function public.am_i_pro() to authenticated;
revoke execute on function public.is_pro(uuid) from public, anon, authenticated;

drop policy if exists "Own domains: add when Pro" on public.custom_domains;
create policy "Own domains: add when Pro" on public.custom_domains
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and verified = false
    and public.am_i_pro()
    and exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 1. Image storage. The `assets` rows are written by the browser, so they cannot be trusted for the
-- limit: an account could skip them, shrink their size or delete them. The storage service records
-- each file's real size in storage.objects.metadata.
-- ---------------------------------------------------------------------------
create or replace function public.storage_used()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(nullif(o.metadata ->> 'size', '')::bigint), 0)::bigint
  from storage.objects o
  where o.bucket_id = 'portfolio-images'
    and o.name like (select auth.uid())::text || '/%';
$$;

create or replace function public.can_upload()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.storage_used()
    < (case when public.is_pro((select auth.uid())) then 2147483648 else 52428800 end);
$$;

revoke execute on function public.storage_used() from public, anon;
grant execute on function public.storage_used() to authenticated;
revoke execute on function public.can_upload() from public, anon;
grant execute on function public.can_upload() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Locked messages. Reading the table directly shows them only to Pro accounts. The inbox reads
-- through list_messages(), which returns locked messages with their text left out, so a Free
-- account still sees that a message is waiting.
-- ---------------------------------------------------------------------------
drop policy if exists "Own messages: read" on public.form_submissions;
create policy "Own messages: read" on public.form_submissions
  for select to authenticated
  using (
    exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))
    and (not locked or public.am_i_pro())
  );

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
  join public.portfolios p on p.id = s.portfolio_id
  cross join me
  where p.user_id = me.id
  order by s.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

revoke execute on function public.list_messages(integer) from public, anon;
grant execute on function public.list_messages(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Document size: 2 MB each, far above any real portfolio (images are links, never inline).
-- NOT VALID: rows saved before this file are not checked, so no saved portfolio breaks.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_doc_size') then
    alter table public.portfolios add constraint portfolios_doc_size check (
      pg_column_size(doc) <= 2097152
      and (published_doc is null or pg_column_size(published_doc) <= 2097152)
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'portfolio_versions_doc_size') then
    alter table public.portfolio_versions add constraint portfolio_versions_doc_size check (
      pg_column_size(doc) <= 2097152
    ) not valid;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. One account's limit checks run one at a time. Without the lock, two requests sent together
-- could both count "2 portfolios" and both insert. The lock is per account and ends with the
-- transaction; nested calls in the same transaction take it again without waiting.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_portfolio_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pro boolean := public.is_pro(new.user_id);
  existing integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if tg_op = 'INSERT' and not pro then
    select count(*) into existing from public.portfolios where user_id = new.user_id;
    if existing >= 3 then
      raise exception 'plan_limit_portfolios' using errcode = 'P0001';
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    select count(*) into existing from public.portfolios
    where user_id = new.user_id and status = 'published' and id <> new.id;
    if existing >= (case when pro then 10 else 1 end) then
      raise exception 'plan_limit_published' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_portfolio_limits() from public, anon, authenticated;

-- Same lock first, so two "Replace my live page" calls from two tabs cannot lock each other's rows
-- in opposite order (a deadlock) and cannot both leave a page live.
create or replace function public.publish_replacing_live(p_id uuid, p_slug text, p_doc jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  offline text[];
  stamp timestamptz := now();
begin
  if me is null then
    raise exception 'login' using errcode = '28000';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(me::text, 0));
  if not exists (select 1 from public.portfolios where id = p_id and user_id = me) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  -- Take the account's other live pages offline. Row security limits this to the caller's own.
  with taken as (
    update public.portfolios
    set status = 'draft', published_doc = null
    where user_id = me and status = 'published' and id <> p_id
    returning slug
  )
  select coalesce(array_agg(slug), '{}') into offline from taken;
  -- Then publish this one. The plan-limit trigger still checks the result.
  update public.portfolios
  set slug = lower(p_slug), published_doc = p_doc, status = 'published', published_at = stamp
  where id = p_id and user_id = me;
  insert into public.portfolio_versions (portfolio_id, doc, label) values (p_id, p_doc, 'Published');
  return jsonb_build_object('published_at', stamp, 'offline', to_jsonb(offline));
end;
$$;

revoke execute on function public.publish_replacing_live(uuid, text, jsonb) from public, anon;
grant execute on function public.publish_replacing_live(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Visit counts. Every visit used to add 1 to the same row, so visits to a busy page waited for
-- each other and held database connections meanwhile. Each visit now picks one of 16 rows; readers
-- add the rows up (the dashboard already sums per page).
-- ---------------------------------------------------------------------------
alter table public.page_views add column if not exists shard smallint not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'page_views_shard_range') then
    alter table public.page_views add constraint page_views_shard_range check (shard between 0 and 15);
  end if;
  if (select array_length(conkey, 1) from pg_constraint
      where conname = 'page_views_pkey' and conrelid = 'public.page_views'::regclass) <> 3 then
    alter table public.page_views drop constraint page_views_pkey;
    alter table public.page_views add constraint page_views_pkey primary key (portfolio_id, day, shard);
  end if;
end;
$$;

create or replace function public.record_page_view(p_slug text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.page_views (portfolio_id, day, shard, views)
  select p.id, current_date, floor(random() * 16)::smallint, 1 from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published'
  on conflict (portfolio_id, day, shard) do update set views = public.page_views.views + 1;
$$;

revoke execute on function public.record_page_view(text) from public;
grant execute on function public.record_page_view(text) to anon, authenticated;
