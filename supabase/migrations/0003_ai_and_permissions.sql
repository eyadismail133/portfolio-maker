-- Portfolio Maker: AI writing limits for Pro accounts, and tighter function permissions.
-- Run after 0002_publishing.sql, in the Supabase SQL editor. Safe to run again.

-- ---------------------------------------------------------------------------
-- Fix: Supabase gives the "anon" role direct access to new functions, so revoking from
-- "public" alone was not enough. Visitors without an account must not call these.
-- ---------------------------------------------------------------------------
revoke execute on function public.is_slug_available(text) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
revoke execute on function public.trim_portfolio_versions() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- AI writing: Pro accounts only, with a daily limit per account.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  uses integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

drop policy if exists "Own AI usage: read" on public.ai_usage;
create policy "Own AI usage: read" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Takes one AI use for the signed-in account.
-- Returns the uses left today, -1 when the account is not Pro, -2 when today's limit is reached.
create or replace function public.use_ai_credit(p_daily_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  used integer;
begin
  if me is null then
    return -1;
  end if;
  if not exists (select 1 from public.profiles p where p.id = me and p.plan = 'pro') then
    return -1;
  end if;
  insert into public.ai_usage (user_id, day, uses) values (me, current_date, 0)
  on conflict (user_id, day) do nothing;
  select u.uses into used from public.ai_usage u where u.user_id = me and u.day = current_date for update;
  if used >= least(greatest(p_daily_limit, 1), 200) then
    return -2;
  end if;
  update public.ai_usage set uses = uses + 1 where user_id = me and day = current_date;
  return least(greatest(p_daily_limit, 1), 200) - used - 1;
end;
$$;

revoke execute on function public.use_ai_credit(integer) from public, anon;
grant execute on function public.use_ai_credit(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Giving an account Pro by hand (until payments exist), in the SQL editor:
--   update public.profiles set plan = 'pro'
--   where id = (select id from auth.users where email = 'person@example.com');
-- ---------------------------------------------------------------------------
