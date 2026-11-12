-- Portfolio Maker: visitors can report a published page (spam, scams, stolen work, abuse).
-- Run after 0004_plans_and_billing.sql, in the Supabase SQL editor. Run once.
-- Read reports in the Table Editor (abuse_reports) or with:
--   select * from public.abuse_reports order by created_at desc;

create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios (id) on delete set null,
  slug text not null,
  reason text not null check (reason in ('spam', 'scam', 'stolen', 'offensive', 'personal', 'other')),
  details text not null default '' check (char_length(details) <= 2000),
  reporter_email text not null default '' check (char_length(reporter_email) <= 200),
  status text not null default 'new' check (status in ('new', 'reviewed', 'actioned')),
  created_at timestamptz not null default now()
);

create index if not exists abuse_reports_created_idx on public.abuse_reports (created_at desc);

-- No policies: nobody reads or writes this table through the API. Only the function below adds
-- rows, and only the project owner reads them in the dashboard.
alter table public.abuse_reports enable row level security;

create or replace function public.submit_abuse_report(p_slug text, p_reason text, p_details text, p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select p.id into target from public.portfolios p where p.slug = lower(p_slug) and p.status = 'published';
  if target is null then
    return 'not_found';
  end if;
  if p_reason not in ('spam', 'scam', 'stolen', 'offensive', 'personal', 'other') then
    return 'invalid';
  end if;
  if (select count(*) from public.abuse_reports r
      where r.slug = lower(p_slug) and r.created_at > now() - interval '1 hour') >= 20 then
    return 'busy';
  end if;
  insert into public.abuse_reports (portfolio_id, slug, reason, details, reporter_email)
  values (target, lower(p_slug), p_reason, left(trim(coalesce(p_details, '')), 2000), left(trim(coalesce(p_email, '')), 200));
  return 'ok';
end;
$$;

revoke execute on function public.submit_abuse_report(text, text, text, text) from public;
grant execute on function public.submit_abuse_report(text, text, text, text) to anon, authenticated;
