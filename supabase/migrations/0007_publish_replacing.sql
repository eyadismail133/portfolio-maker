-- Portfolio Maker: on Free (one published page), publish a portfolio in place of the live one in
-- a single step, so it can never end half done (the old page offline and the new one not live).
-- Run after 0006_signups_domains_errors.sql, in the Supabase SQL editor. Safe to run again.

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
