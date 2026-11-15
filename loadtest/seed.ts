/**
 * Fills the database with clearly marked fake data for a load test.
 *
 *   npm run loadtest:seed -- --dry-run      shows what it would create, writes nothing
 *   npm run loadtest:seed                   creates it (about 2–4 minutes)
 *   npm run loadtest:cleanup                removes all of it again
 *
 * Options: --accounts=200 (Free accounts, each with 3 portfolios, 1 published),
 * --editors=20 (Pro accounts the k6 test signs in as), --drafts=15 (draft portfolios per editor;
 * the k6 test needs at least as many drafts in total as fake users, 143 at SCALE=1),
 * --messages=20000, --signups=5000, --days=30 (days of visit counts per published page).
 *
 * Every account's email is loadtest-…@loadtest.example.com and no emails are sent. The accounts,
 * page links and password for the k6 test go to loadtest/.loadtest-data.json (not committed).
 */
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { createSampleDoc } from "../src/render-kit/samples";
import { families } from "../src/render-kit/themes/families";
import type { PortfolioDoc } from "../src/render-kit/schema/document";
import {
  adminClient,
  DATA_FILE,
  FAKE_DOMAIN,
  FAKE_PREFIX,
  flag,
  inBatches,
  isFakeEmail,
  option,
} from "./shared";

const ACCOUNTS = option("accounts", 200);
const EDITORS = option("editors", 20);
const MESSAGES = option("messages", 20000);
const SIGNUPS = option("signups", 5000);
const DAYS = option("days", 30);
const PER_EDITOR = option("drafts", 15);
const DRY = flag("dry-run");

const KINDS = ["personal", "company", "startup"] as const;
const pick = <T>(list: readonly T[], i: number) => list[i % list.length];
const randomInt = (max: number) => Math.floor(Math.random() * max);
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

function sampleDoc(i: number): PortfolioDoc {
  const doc = createSampleDoc({ family: pick(families, i).id, kind: pick(KINDS, i) });
  doc.meta.title = `Load test portfolio ${i}`;
  return doc;
}

async function main() {
  const docSizes = Array.from({ length: 6 }, (_, i) => JSON.stringify(sampleDoc(i)).length);
  const averageDoc = docSizes.reduce((a, b) => a + b, 0) / docSizes.length;
  const portfolios = ACCOUNTS * 3 + EDITORS * PER_EDITOR;
  // Working copies, published copies and their versions, plus messages, sign-ups and visits.
  const estimateMb =
    (averageDoc * (portfolios + ACCOUNTS * 2) +
      MESSAGES * 400 +
      SIGNUPS * 150 +
      ACCOUNTS * DAYS * 80) /
    1024 /
    1024;

  console.log("Load-test data plan");
  console.log(`  Free accounts:      ${ACCOUNTS} (3 portfolios each, 1 published)`);
  console.log(`  Pro editor accounts: ${EDITORS} (${PER_EDITOR} drafts each, used by k6)`);
  console.log(
    `  Portfolios:         ${portfolios} (about ${Math.round(averageDoc / 1024)} KB each)`,
  );
  console.log(`  Messages:           ${MESSAGES}`);
  console.log(`  Newsletter sign-ups: ${SIGNUPS}`);
  console.log(`  Visit-count rows:   ${ACCOUNTS * DAYS}`);
  console.log(`  Database space:     about ${Math.round(estimateMb)} MB (Free plan: 500 MB)`);
  if (DRY) {
    console.log("\nDry run: nothing was written.");
    return;
  }

  const { db } = adminClient();
  if (existsSync(DATA_FILE))
    throw new Error(`${DATA_FILE} exists: run "npm run loadtest:cleanup" before seeding again.`);
  const { data: firstPage, error: listError } = await db.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;
  if (firstPage.users.some((u) => isFakeEmail(u.email)))
    throw new Error('Fake accounts already exist: run "npm run loadtest:cleanup" first.');

  const password = randomBytes(18).toString("base64url");
  const started = Date.now();

  // 1. Accounts. Created confirmed, so no email is sent.
  console.log("\nCreating accounts…");
  const makeUser = async (email: string, name: string) => {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error || !data.user) throw error ?? new Error(`could not create ${email}`);
    return data.user.id;
  };
  const freeIds: string[] = new Array(ACCOUNTS);
  await inBatches([...Array(ACCOUNTS).keys()], 8, async (i) => {
    freeIds[i] = await makeUser(`${FAKE_PREFIX}${i}@${FAKE_DOMAIN}`, `Load Test ${i}`);
  });
  const editors: { email: string; id: string; portfolioIds: string[] }[] = [];
  await inBatches([...Array(EDITORS).keys()], 8, async (i) => {
    const email = `${FAKE_PREFIX}editor-${i}@${FAKE_DOMAIN}`;
    editors[i] = { email, id: await makeUser(email, `Load Test Editor ${i}`), portfolioIds: [] };
  });
  // Editors are Pro, so each can have more than 3 portfolios.
  const { error: proError } = await db
    .from("profiles")
    .update({ plan: "pro", pro_until: null })
    .in(
      "id",
      editors.map((e) => e.id),
    );
  if (proError) throw proError;

  // 2. Portfolios. One published page per Free account; editors get drafts.
  console.log("Creating portfolios…");
  const published: { id: string; userId: string; slug: string }[] = [];
  const now = new Date().toISOString();
  await inBatches([...Array(ACCOUNTS).keys()], 10, async (i) => {
    const rows = [0, 1, 2].map((n) => {
      const doc = sampleDoc(i * 3 + n);
      return n === 0
        ? {
            user_id: freeIds[i],
            title: doc.meta.title,
            doc,
            slug: `${FAKE_PREFIX}${i}`,
            status: "published",
            published_doc: doc,
            published_at: now,
          }
        : // Same columns as the published row: a bulk insert sets missing columns to null.
          {
            user_id: freeIds[i],
            title: doc.meta.title,
            doc,
            slug: null,
            status: "draft",
            published_doc: null,
            published_at: null,
          };
    });
    const { data, error } = await db.from("portfolios").insert(rows).select("id, slug");
    if (error) throw error;
    const live = data.find((r) => r.slug);
    if (live) published.push({ id: live.id, userId: freeIds[i], slug: live.slug });
  });
  await inBatches(editors, 5, async (editor, i) => {
    const rows = Array.from({ length: PER_EDITOR }, (_, n) => {
      const doc = sampleDoc(1000 + i * PER_EDITOR + n);
      return { user_id: editor.id, title: doc.meta.title, doc };
    });
    const { data, error } = await db.from("portfolios").insert(rows).select("id");
    if (error) throw error;
    editor.portfolioIds = data.map((r) => r.id);
  });

  // 3. Inbox messages, sign-ups and visit counts on the published pages.
  console.log("Creating messages, sign-ups and visit counts…");
  const insertAll = async (table: string, rows: Record<string, unknown>[]) => {
    for (let i = 0; i < rows.length; i += 1000) {
      const { error } = await db.from(table).insert(rows.slice(i, i + 1000));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  };
  if (published.length > 0) {
    await insertAll(
      "form_submissions",
      Array.from({ length: MESSAGES }, (_, n) => ({
        portfolio_id: pick(published, n).id,
        name: `Visitor ${n}`,
        email: `${FAKE_PREFIX}visitor-${n}@${FAKE_DOMAIN}`,
        message: `Hello, this is load-test message ${n}. I liked your work and would like to talk about a project.`,
        is_read: Math.random() < 0.7,
        created_at: daysAgo(Math.random() * 60).toISOString(),
      })),
    );
    await insertAll(
      "newsletter_signups",
      Array.from({ length: SIGNUPS }, (_, n) => ({
        portfolio_id: pick(published, n).id,
        email: `${FAKE_PREFIX}reader-${n}@${FAKE_DOMAIN}`,
        created_at: daysAgo(Math.random() * 60).toISOString(),
      })),
    );
    await insertAll(
      "page_views",
      published.flatMap((page) =>
        Array.from({ length: DAYS }, (_, d) => ({
          portfolio_id: page.id,
          owner_id: page.userId,
          day: daysAgo(d).toISOString().slice(0, 10),
          shard: 0,
          views: randomInt(60),
        })),
      ),
    );
  }

  writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        note: "Load-test accounts. Do not commit. Removed by npm run loadtest:cleanup.",
        password,
        editors: editors.map((e) => ({ email: e.email, portfolioIds: e.portfolioIds })),
        slugs: published.map((p) => p.slug),
      },
      null,
      2,
    ),
  );
  console.log(`\nDone in ${Math.round((Date.now() - started) / 1000)} s. Wrote ${DATA_FILE}.`);
  console.log("Next: run the k6 test (loadtest/README.md), then npm run loadtest:cleanup.");
}

main().catch((error) => {
  console.error("\nSeeding stopped:", error instanceof Error ? error.message : error);
  console.error("Run npm run loadtest:cleanup to remove anything created so far.");
  process.exit(1);
});
