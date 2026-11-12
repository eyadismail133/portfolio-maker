-- Portfolio Maker: Pro by prepaid months (Paymob), and the Free / Pro limits.
-- Run after 0003_ai_and_permissions.sql, in the Supabase SQL editor. Safe to run again.
--
-- Limits (keep in step with src/lib/plans.ts; a test checks this file):
--   portfolios:        free 3,      pro unlimited
--   published pages:   free 1,      pro 10
--   image storage:     free 50 MB,  pro 2 GB
--   versions kept:     free 5,      pro 30
--   messages a month:  free 50,     pro unlimited (later ones are kept but locked until Pro)
--   badge on pages:    free shown,  pro hidden

-- ---------------------------------------------------------------------------
-- Who is Pro: plan 'pro' and not expired. pro_until empty means Pro with no end date
-- (given by hand in the SQL editor).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists pro_until timestamptz;

create or replace function public.is_pro(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user and p.plan = 'pro' and (p.pro_until is null or p.pro_until > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- Portfolios and published pages
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

drop trigger if exists portfolios_plan_limits on public.portfolios;
create trigger portfolios_plan_limits
  before insert or update of status on public.portfolios
  for each row execute function public.enforce_portfolio_limits();

-- ---------------------------------------------------------------------------
-- Image storage
-- ---------------------------------------------------------------------------
create or replace function public.can_upload()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(a.size), 0) < (case when public.is_pro((select auth.uid())) then 2147483648 else 52428800 end)
  from public.assets a
  where a.user_id = (select auth.uid());
$$;

drop policy if exists "Portfolio images: upload to own folder" on storage.objects;
create policy "Portfolio images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.can_upload()
  );

-- ---------------------------------------------------------------------------
-- Version history: free accounts keep 5, Pro keeps 30
-- ---------------------------------------------------------------------------
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
      limit (case when public.is_pro(new.user_id) then 30 else 5 end)
    );
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Messages: after 50 in a month, free accounts get new ones locked until they go Pro.
-- Nothing a visitor sends is ever lost.
-- ---------------------------------------------------------------------------
alter table public.form_submissions add column if not exists locked boolean not null default false;

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
  join public.portfolios p on p.id = s.portfolio_id
  where p.user_id = owner and s.created_at >= date_trunc('month', now());
  insert into public.form_submissions (portfolio_id, name, email, message, locked)
  values (target, trim(p_name), trim(p_email), trim(p_message), not public.is_pro(owner) and this_month >= 50);
  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- Published pages also say whether to show the "Made with Portfolio Maker" badge.
-- The return type changes, so the function is replaced.
-- ---------------------------------------------------------------------------
drop function if exists public.get_published_portfolio(text);
create function public.get_published_portfolio(p_slug text)
returns table (title text, doc jsonb, published_at timestamptz, show_badge boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, p.published_doc, p.published_at, not public.is_pro(p.user_id)
  from public.portfolios p
  where p.slug = lower(p_slug) and p.status = 'published' and p.published_doc is not null
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- AI: uses is_pro, so Pro that has run out stops AI too.
-- ---------------------------------------------------------------------------
create or replace function public.use_ai_credit(p_daily_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  cap integer := least(greatest(p_daily_limit, 1), 200);
  used integer;
begin
  if me is null or not public.is_pro(me) then
    return -1;
  end if;
  insert into public.ai_usage (user_id, day, uses) values (me, current_date, 0)
  on conflict (user_id, day) do nothing;
  select u.uses into used from public.ai_usage u where u.user_id = me and u.day = current_date for update;
  if used >= cap then
    return -2;
  end if;
  update public.ai_usage set uses = uses + 1 where user_id = me and day = current_date;
  return cap - used - 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Payments. Only the server writes here (with the secret key, after Paymob confirms).
-- People can read their own payments.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'paymob',
  months integer not null check (months in (1, 3, 6, 12)),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (currency in ('EGP', 'USD')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider_order_id text,
  provider_transaction_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

drop policy if exists "Own payments: read" on public.payments;
create policy "Own payments: read" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

-- Called by the payment webhook only. Safe to call twice for the same payment.
create or replace function public.apply_paid_payment(
  p_payment_id uuid,
  p_transaction_id text,
  p_amount_cents integer,
  p_currency text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then
    return 'not_found';
  end if;
  if pay.status = 'paid' then
    return 'already_paid';
  end if;
  if pay.amount_cents <> p_amount_cents or pay.currency <> upper(p_currency) then
    update public.payments set status = 'failed' where id = pay.id;
    return 'mismatch';
  end if;
  update public.payments
  set status = 'paid', paid_at = now(), provider_transaction_id = p_transaction_id
  where id = pay.id;
  update public.profiles p
  set plan = 'pro',
      pro_until = case
        when p.plan = 'pro' and p.pro_until is null then null
        else greatest(coalesce(p.pro_until, now()), now()) + make_interval(months => pay.months)
      end
  where p.id = pay.user_id;
  return 'ok';
end;
$$;

create or replace function public.mark_payment_failed(p_payment_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set status = 'failed' where id = p_payment_id and status = 'pending';
$$;

-- ---------------------------------------------------------------------------
-- Who may call the functions
-- ---------------------------------------------------------------------------
revoke execute on function public.is_pro(uuid) from public, anon;
grant execute on function public.is_pro(uuid) to authenticated;
revoke execute on function public.can_upload() from public, anon;
grant execute on function public.can_upload() to authenticated;
revoke execute on function public.enforce_portfolio_limits() from public, anon, authenticated;
revoke execute on function public.trim_portfolio_versions() from public, anon, authenticated;
revoke execute on function public.get_published_portfolio(text) from public;
grant execute on function public.get_published_portfolio(text) to anon, authenticated;
revoke execute on function public.use_ai_credit(integer) from public, anon;
grant execute on function public.use_ai_credit(integer) to authenticated;
revoke execute on function public.apply_paid_payment(uuid, text, integer, text) from public, anon, authenticated;
revoke execute on function public.mark_payment_failed(uuid) from public, anon, authenticated;
grant execute on function public.apply_paid_payment(uuid, text, integer, text) to service_role;
grant execute on function public.mark_payment_failed(uuid) to service_role;
