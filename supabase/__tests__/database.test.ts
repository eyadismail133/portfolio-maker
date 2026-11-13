/* eslint-disable @typescript-eslint/no-explicit-any -- rows from raw SQL */
/**
 * Runs every migration in a real Postgres (PGlite) with small stand-ins for Supabase's auth and
 * storage schemas and roles, then checks the security rules and plan limits as each kind of user.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, expect, test } from "vitest";

const DIR = "supabase/migrations/";
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const db = new PGlite();
const results: { name: string; ok: boolean; extra: string }[] = [];
const check = (name: string, ok: boolean, extra = "") => results.push({ name, ok, extra });

const q = async (sql: string): Promise<any[]> => (await db.query<any>(sql)).rows as any[];

async function as(role: string, sub: string | null, sql: string, params?: unknown[]) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`,
  );
  try {
    return {
      rows: (await db.query<any>(sql, params)).rows,
      error: undefined as string | undefined,
    };
  } catch (e) {
    return { rows: [] as any[], error: (e as Error).message };
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) await db.exec(readFileSync(DIR + f, "utf8"));
  // The newest migration must be safe to run a second time.
  await db.exec(readFileSync(DIR + files[files.length - 1], "utf8"));
  await db.exec(
    `insert into auth.users (id, email, raw_user_meta_data) values ('${A}', 'a@x.co', '{"full_name":"Ann"}'), ('${B}', 'b@x.co', '{}')`,
  );
  check(
    "profiles created on sign-up",
    (await q("select count(*)::int n from profiles"))[0].n === 2,
  );

  const doc = JSON.stringify({ schemaVersion: 1 });
  const mk = (t: string) =>
    as("authenticated", A, `insert into portfolios (title, doc) values ($1, $2) returning id`, [
      t,
      doc,
    ]);
  const p1 = (await mk("one")).rows?.[0]?.id;
  await mk("two");
  await mk("three");
  const fourth = await mk("four");
  check(
    "free: 4th portfolio refused",
    /plan_limit_portfolios/.test(fourth.error ?? ""),
    fourth.error,
  );
  const pub = (id: string, slug: string) =>
    as(
      "authenticated",
      A,
      `update portfolios set slug = $2, status = 'published', published_doc = doc where id = $1 returning id`,
      [id, slug],
    );
  check("free: first publish", (await pub(p1, "ann")).rows?.length === 1);
  const ids = (
    await as("authenticated", A, "select id from portfolios order by created_at")
  ).rows.map((r) => r.id);
  const second = await pub(ids[1], "ann-two");
  check(
    "free: 2nd published page refused",
    /plan_limit_published/.test(second.error ?? ""),
    second.error,
  );
  check(
    "republish same page allowed",
    (
      await as(
        "authenticated",
        A,
        `update portfolios set status='published', published_doc = doc where id = $1 returning id`,
        [p1],
      )
    ).rows?.length === 1,
  );
  // Free: publish another page in place of the live one, in one step.
  const rep = await as(
    "authenticated",
    A,
    "select public.publish_replacing_live($1, 'Ann-Two', doc) r from portfolios where id = $1",
    [ids[1]],
  );
  const repOut = rep.rows?.[0]?.r;
  check(
    "free: replace the live page in one step",
    !rep.error && repOut?.offline?.[0] === "ann",
    rep.error ?? JSON.stringify(repOut),
  );
  const after = (
    await as(
      "authenticated",
      A,
      "select id, slug, status, published_doc is null gone from portfolios where status = 'published' or id = $1",
      [p1],
    )
  ).rows;
  check(
    "replace: old page offline, new page live with a lower-case slug",
    after.length === 2 &&
      after.some((r) => r.id === p1 && r.status === "draft" && r.gone) &&
      after.some((r) => r.id === ids[1] && r.status === "published" && r.slug === "ann-two"),
    JSON.stringify(after),
  );
  check(
    "replace: a Published version is saved",
    (
      await q(
        `select count(*)::int n from portfolio_versions where portfolio_id = '${ids[1]}' and label = 'Published'`,
      )
    )[0].n === 1,
  );
  check(
    "replace: others' portfolios are refused",
    /not_found/.test(
      (
        await as("authenticated", B, "select public.publish_replacing_live($1, 'x', '{}'::jsonb)", [
          ids[1],
        ])
      ).error ?? "",
    ),
  );
  check(
    "replace: visitors cannot call it",
    !!(
      await as("anon", null, "select public.publish_replacing_live($1, 'x', '{}'::jsonb)", [ids[1]])
    ).error,
  );
  // Back to the first page live, as the later checks expect.
  await as(
    "authenticated",
    A,
    "select public.publish_replacing_live($1, 'ann', doc) from portfolios where id = $1",
    [p1],
  );
  check(
    "B cannot see A's portfolios",
    (await as("authenticated", B, "select * from portfolios")).rows.length === 0,
  );
  check(
    "visitor cannot read tables",
    (await as("anon", null, "select * from portfolios")).rows.length === 0,
  );
  const visitorPage = (
    await as("anon", null, "select title, show_badge from get_published_portfolio('ann')")
  ).rows;
  check(
    "visitor reads published page with badge",
    visitorPage[0]?.show_badge === true,
    JSON.stringify(visitorPage),
  );
  check(
    "visitor cannot check link names",
    /permission denied/.test((await as("anon", null, "select is_slug_available('x')")).error ?? ""),
  );
  check(
    "visitor cannot call is_pro",
    /permission denied/.test((await as("anon", null, `select is_pro('${A}')`)).error ?? ""),
  );
  check(
    "account cannot change own plan",
    /permission denied/.test(
      (await as("authenticated", A, "update profiles set plan='pro'")).error ?? "",
    ),
  );
  check(
    "account cannot set own pro_until",
    /permission denied/.test(
      (await as("authenticated", A, "update profiles set pro_until = now() + interval '9 years'"))
        .error ?? "",
    ),
  );
  check(
    "account cannot apply a payment",
    /permission denied/.test(
      (await as("authenticated", A, `select apply_paid_payment(gen_random_uuid(), 'x', 1, 'EGP')`))
        .error ?? "",
    ),
  );
  check(
    "account cannot insert a payment",
    !!(
      await as(
        "authenticated",
        A,
        `insert into payments (user_id, months, amount_cents, currency) values ('${A}', 1, 1, 'EGP')`,
      )
    ).error,
  );
  check(
    "free: AI refused",
    (await as("authenticated", A, "select use_ai_credit(50) n")).rows[0].n === -1,
  );

  // Versions: free keeps 5
  for (let i = 0; i < 7; i++)
    await as(
      "authenticated",
      A,
      `insert into portfolio_versions (portfolio_id, doc, label, created_at) values ($1, $2, $3, now() + make_interval(secs => $4))`,
      [p1, doc, "v" + i, i],
    );
  check(
    "free: 5 versions kept",
    (
      await as(
        "authenticated",
        A,
        "select count(*)::int n from portfolio_versions where portfolio_id = $1",
        [p1],
      )
    ).rows[0].n === 5,
  );
  check(
    "B cannot add a version to A's portfolio",
    !!(
      await as(
        "authenticated",
        B,
        `insert into portfolio_versions (portfolio_id, doc) values ($1, $2)`,
        [p1, doc],
      )
    ).error,
  );

  // Messages: free locks after 50 a month
  await db.exec(
    `insert into form_submissions (portfolio_id, name, email, message, created_at) select '${p1}', 'n', 'e@x.co', 'm', now() - interval '2 hours' from generate_series(1, 50)`,
  );
  check(
    "visitor message accepted",
    (await as("anon", null, "select submit_contact_message('ann', 'Vi', 'v@x.co', 'Hello') r"))
      .rows[0].r === "ok",
  );
  check(
    "free: 51st message this month is locked",
    (await q("select locked from form_submissions where name = 'Vi'"))[0].locked === true,
  );

  // Uploads: free 50 MB
  await db.exec(
    `insert into storage.buckets (id) values ('portfolio-images') on conflict do nothing`,
  );
  check(
    "free: upload allowed under 50 MB",
    !(
      await as(
        "authenticated",
        A,
        `insert into storage.objects (bucket_id, name) values ('portfolio-images', '${A}/1.webp')`,
      )
    ).error,
  );
  check(
    "upload into someone else's folder refused",
    !!(
      await as(
        "authenticated",
        A,
        `insert into storage.objects (bucket_id, name) values ('portfolio-images', '${B}/1.webp')`,
      )
    ).error,
  );
  await as(
    "authenticated",
    A,
    `insert into assets (path, width, height, size) values ('${A}/big.webp', 1, 1, 60000000)`,
  );
  check(
    "free: upload refused over 50 MB",
    !!(
      await as(
        "authenticated",
        A,
        `insert into storage.objects (bucket_id, name) values ('portfolio-images', '${A}/2.webp')`,
      )
    ).error,
  );

  // Payment makes A Pro for 1 month
  const pay: string = (
    await as(
      "service_role",
      null,
      `insert into payments (user_id, months, amount_cents, currency) values ('${A}', 1, 25000, 'EGP') returning id`,
    )
  ).rows[0].id;
  check(
    "wrong amount is refused",
    (await as("service_role", null, `select apply_paid_payment($1, 'tx0', 100, 'EGP') r`, [pay]))
      .rows[0].r === "mismatch",
  );
  const pay2: string = (
    await as(
      "service_role",
      null,
      `insert into payments (user_id, months, amount_cents, currency) values ('${A}', 3, 75000, 'EGP') returning id`,
    )
  ).rows[0].id;
  check(
    "payment applied",
    (await as("service_role", null, `select apply_paid_payment($1, 'tx1', 75000, 'egp') r`, [pay2]))
      .rows[0].r === "ok",
  );
  check(
    "same payment twice is ignored",
    (await as("service_role", null, `select apply_paid_payment($1, 'tx1', 75000, 'EGP') r`, [pay2]))
      .rows[0].r === "already_paid",
  );
  const until = (
    await db.query<any>(
      `select pro_until > now() + interval '89 days' and pro_until < now() + interval '93 days' ok, plan from profiles where id = '${A}'`,
    )
  ).rows[0];
  check("3 months of Pro granted", until.ok && until.plan === "pro", JSON.stringify(until));
  check(
    "A sees own payments, B does not",
    (await as("authenticated", A, "select * from payments")).rows.length === 2 &&
      (await as("authenticated", B, "select * from payments")).rows.length === 0,
  );
  check("pro: 4th portfolio allowed", !(await mk("four")).error);
  check("pro: 2nd published page allowed", (await pub(ids[1], "ann-two")).rows?.length === 1);
  check(
    "pro: page has no badge",
    (await as("anon", null, "select show_badge from get_published_portfolio('ann')")).rows[0]
      .show_badge === false,
  );
  check(
    "pro: AI allowed",
    (await as("authenticated", A, "select use_ai_credit(50) n")).rows[0].n === 49,
  );
  check(
    "pro: upload allowed again",
    !(
      await as(
        "authenticated",
        A,
        `insert into storage.objects (bucket_id, name) values ('portfolio-images', '${A}/3.webp')`,
      )
    ).error,
  );
  const pay3: string = (
    await as(
      "service_role",
      null,
      `insert into payments (user_id, months, amount_cents, currency) values ('${A}', 1, 600, 'USD') returning id`,
    )
  ).rows[0].id;
  await as("service_role", null, `select apply_paid_payment($1, 'tx2', 600, 'USD')`, [pay3]);
  check(
    "a second purchase adds to the end date",
    (
      await db.query<any>(
        `select pro_until > now() + interval '119 days' ok from profiles where id = '${A}'`,
      )
    ).rows[0].ok,
  );

  // Expiry
  await db.exec(`update profiles set pro_until = now() - interval '1 day' where id = '${A}'`);
  check(
    "expired Pro is free again",
    (await as("authenticated", A, "select use_ai_credit(50) n")).rows[0].n === -1,
  );
  check(
    "expired Pro keeps pages online",
    (await as("anon", null, "select count(*)::int n from get_published_portfolio('ann-two')"))
      .rows[0].n === 1,
  );
  await db.exec(`update profiles set plan = 'pro', pro_until = null where id = '${B}'`);
  check(
    "Pro given by hand never ends",
    (await as("authenticated", B, "select use_ai_credit(50) n")).rows[0].n === 49,
  );
  check(
    "visitor can report a published page",
    (
      await as(
        "anon",
        null,
        "select submit_abuse_report('ann', 'spam', 'Selling fake followers', 'r@x.co') r",
      )
    ).rows[0]?.r === "ok",
  );
  check(
    "reports about unknown pages are refused",
    (await as("anon", null, "select submit_abuse_report('nobody-here', 'spam', '', '') r")).rows[0]
      ?.r === "not_found",
  );
  check(
    "reports with an unknown reason are refused",
    (await as("anon", null, "select submit_abuse_report('ann', 'whatever', '', '') r")).rows[0]
      ?.r === "invalid",
  );
  check(
    "visitors cannot read reports",
    (await as("anon", null, "select * from abuse_reports")).rows.length === 0,
  );
  check(
    "accounts cannot read reports",
    (await as("authenticated", A, "select * from abuse_reports")).rows.length === 0,
  );
  check("the report was stored", (await q("select count(*)::int n from abuse_reports"))[0].n === 1);
  // 0006: newsletter sign-ups
  const signup = (slug: string, email: string) =>
    as("anon", null, "select submit_newsletter_signup($1, $2) r", [slug, email]);
  check(
    "visitors can sign up on a published page",
    (await signup("ann", "Reader@x.co")).rows[0]?.r === "ok",
  );
  check(
    "signing up twice keeps one row",
    (await signup("ann", "reader@x.co ")).rows[0]?.r === "ok",
  );
  check(
    "one sign-up row per address",
    (await q("select count(*)::int n from newsletter_signups"))[0].n === 1,
  );
  check(
    "sign-ups need a real address",
    (await signup("ann", "not-an-email")).rows[0]?.r === "invalid",
  );
  check(
    "sign-ups for unknown pages are refused",
    (await signup("nobody-here", "a@b.co")).rows[0]?.r === "not_found",
  );
  check(
    "visitors cannot add sign-ups directly",
    !!(
      await as(
        "anon",
        null,
        "insert into newsletter_signups (portfolio_id, email) values ($1, 'x@y.co')",
        [p1],
      )
    ).error,
  );
  check(
    "the owner reads their sign-ups",
    (await as("authenticated", A, "select email from newsletter_signups")).rows[0]?.email ===
      "reader@x.co",
  );
  check(
    "other accounts do not see them",
    (await as("authenticated", B, "select * from newsletter_signups")).rows.length === 0,
  );

  // 0006: custom domains
  const addDomain = (sub: string, domain: string, verified = false) =>
    as(
      "authenticated",
      sub,
      "insert into custom_domains (domain, portfolio_id, verified) values ($1, $2, $3)",
      [domain, p1, verified],
    );
  await q(`update profiles set plan = 'free', pro_until = null where id = '${A}'`);
  check("free accounts cannot add a domain", !!(await addDomain(A, "ann.example.com")).error);
  await q(
    `update profiles set plan = 'pro', pro_until = now() + interval '30 days' where id = '${A}'`,
  );
  check("Pro accounts can add a domain", !(await addDomain(A, "ann.example.com")).error);
  check(
    "a domain cannot be added already verified",
    !!(await addDomain(A, "x.example.com", true)).error,
  );
  check("bad domain names are refused", !!(await addDomain(A, "not a domain")).error);
  check(
    "accounts cannot add a domain for someone else's page",
    !!(await addDomain(B, "b.example.com")).error,
  );
  check(
    "accounts cannot mark their domain verified",
    !!(await as("authenticated", A, "update custom_domains set verified = true")).error ||
      (await q("select verified from custom_domains"))[0]?.verified === false,
  );
  const resolve = async (domain: string) =>
    (await as("anon", null, "select resolve_custom_domain($1) s", [domain])).rows[0]?.s;
  check("an unverified domain shows nothing", (await resolve("ann.example.com")) == null);
  await q("update custom_domains set verified = true");
  check("a verified domain shows the page", (await resolve("ANN.example.com")) === "ann");
  await q(`update profiles set pro_until = now() - interval '1 day' where id = '${A}'`);
  check("the domain stops when Pro ends", (await resolve("ann.example.com")) == null);
  check(
    "visitors cannot read the domain list",
    (await as("anon", null, "select * from custom_domains")).rows.length === 0,
  );

  // 0006: error log
  check(
    "visitors cannot write the error log",
    !!(await as("anon", null, "insert into error_log (message) values ('x')")).error,
  );
  check(
    "accounts cannot read the error log",
    !!(await as("authenticated", A, "select * from error_log")).error ||
      (await as("authenticated", A, "select * from error_log")).rows.length === 0,
  );
  check(
    "the server can write the error log",
    !(await as("service_role", null, "insert into error_log (message) values ('boom')")).error,
  );

  check(
    "visitor slug lookup after 0004 still blocked",
    /permission denied/.test((await as("anon", null, "select is_slug_available('x')")).error ?? ""),
  );
}, 60_000);

test("database rules and plan limits", () => {
  const failed = results
    .filter((r) => !r.ok)
    .map((r) => `${r.name}${r.extra ? ` (${r.extra})` : ""}`);
  expect(failed).toEqual([]);
  expect(results.length).toBeGreaterThan(30);
});
