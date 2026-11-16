-- ---------------------------------------------------------------------------
-- Portfolio Maker: Pro showcase sections (roadmap Phase 8D).
-- Run after 0010_server_only_forms.sql, in the Supabase SQL editor. Safe to run again.
--
-- Free accounts can try showcase sections in the editor, but only Pro accounts can publish them.
-- The check runs whenever a page's public version is written (publishing from the editor and
-- "Replace my live page"), so it cannot be skipped from the browser. Pages already live are
-- never touched: when Pro ends they stay online, and the page draws each showcase section in a
-- plain free layout instead (`pro: false` in the Renderer).
-- ---------------------------------------------------------------------------

-- The section types only Pro may publish. src/lib/plans.ts lists the same types; a test checks.
create or replace function public.pro_section_types()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['showcase-devices', 'showcase-bento', 'showcase-marquee']::text[];
$$;

-- True when the document shows a Pro section. Hidden sections are not on the page, so they count
-- as absent.
create or replace function public.has_pro_sections(p_doc jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_doc -> 'sections') <> 'array' then false
    else exists (
      select 1
      from jsonb_array_elements(p_doc -> 'sections') as s
      where jsonb_typeof(s) = 'object'
        and s ->> 'type' = any (public.pro_section_types())
        and coalesce(s ->> 'hidden', 'false') <> 'true'
    )
  end;
$$;

create or replace function public.enforce_pro_sections()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.published_doc is not null
    and public.has_pro_sections(new.published_doc)
    and not public.is_pro(new.user_id) then
    raise exception 'plan_pro_sections' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_pro_sections() from public, anon, authenticated;

drop trigger if exists portfolios_pro_sections on public.portfolios;
create trigger portfolios_pro_sections
  before insert or update of published_doc on public.portfolios
  for each row execute function public.enforce_pro_sections();
