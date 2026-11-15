/**
 * Load test for Portfolio Maker (k6). Run from the project folder after `npm run loadtest:seed`:
 *
 *   k6 run loadtest/k6-test.js
 *
 * Three groups of fake users run at the same time for about 6 minutes:
 * - visitors: open a published portfolio, then count the visit (Vercel + cache + one RPC)
 * - editors:  signed-in owners saving their portfolio every ~10 s, sometimes opening the
 *             dashboard (straight to Supabase, like the real editor)
 * - spam:     robots posting the contact form without the spam check; all must be refused
 *
 * SCALE=2 doubles visitors and editors. The default stays far inside the Free/Hobby limits;
 * see loadtest/README.md for the numbers before raising it.
 */
import http from "k6/http";
import exec from "k6/execution";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

// ---------------------------------------------------------------------------
// Settings: the project's .env.local (only the URL and the public key are used) and the seed data.
// ---------------------------------------------------------------------------
const env = {};
for (const line of open("../.env.local").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
}
const SUPABASE_URL = __ENV.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = __ENV.SUPABASE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = (__ENV.BASE_URL || "https://portfolio-maker-ten-virid.vercel.app").replace(
  /\/$/,
  "",
);
const SCALE = Math.max(0.1, Number(__ENV.SCALE || 1));
const data = JSON.parse(open("./.loadtest-data.json"));

const portfolios = [];
data.editors.forEach((editor) =>
  editor.portfolioIds.forEach((id) => portfolios.push({ id, email: editor.email })),
);
const VISITORS = Math.round(100 * SCALE);
const EDITORS = Math.min(Math.round(40 * SCALE), portfolios.length);
// Each fake user is given the portfolio at its VU number, so no two editors share one as long as
// there are at least as many fake drafts as fake users in total.
const ALL_USERS = VISITORS + EDITORS + 3;
if (ALL_USERS > portfolios.length)
  console.warn(
    `${ALL_USERS} fake users but only ${portfolios.length} fake drafts: some editors will share one (save_conflicts). Seed with more --drafts.`,
  );

// Real browsers ask for compressed pages; without this k6 downloads about 4 times more data and
// fills the test computer's own connection (the first run did exactly that).
const BROWSER = {
  "accept-encoding": "gzip, deflate, br",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 (load test)",
};

const saveConflicts = new Counter("save_conflicts");
const spamRefused = new Rate("spam_refused");

export const options = {
  scenarios: {
    visitors: {
      executor: "ramping-vus",
      exec: "visitor",
      stages: [
        { duration: "1m", target: VISITORS },
        { duration: "4m", target: VISITORS },
        { duration: "1m", target: 0 },
      ],
    },
    editors: {
      executor: "ramping-vus",
      exec: "editor",
      stages: [
        { duration: "1m", target: EDITORS },
        { duration: "4m", target: EDITORS },
        { duration: "1m", target: 0 },
      ],
    },
    spam: {
      executor: "constant-vus",
      exec: "spammer",
      vus: 3,
      duration: "5m",
      startTime: "30s",
    },
  },
  thresholds: {
    // What users would feel. A red line in the summary means that part was too slow.
    "http_req_duration{kind:page}": ["p(95)<1000"],
    "http_req_duration{kind:view}": ["p(95)<800"],
    "http_req_duration{kind:save}": ["p(95)<1500"],
    "http_req_duration{kind:dashboard}": ["p(95)<1500"],
    "http_req_duration{kind:spam}": ["p(95)<800"],
    // Stop early if more than 10% of requests fail, so a broken run does not use up the plans.
    http_req_failed: [
      { threshold: "rate<0.01", abortOnFail: false },
      { threshold: "rate<0.10", abortOnFail: true, delayAbortEval: "30s" },
    ],
    checks: ["rate>0.99"],
    spam_refused: ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// ---------------------------------------------------------------------------
// Setup: sign in each editor account once (about 20 sign-ins) and share the tokens.
// ---------------------------------------------------------------------------
export function setup() {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase URL or public key missing in .env.local");
  const tokens = {};
  for (const editor of data.editors) {
    for (let attempt = 1; ; attempt += 1) {
      const res = http.post(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        JSON.stringify({ email: editor.email, password: data.password }),
        {
          headers: { apikey: SUPABASE_KEY, "content-type": "application/json" },
          tags: { kind: "login" },
        },
      );
      if (res.status === 200) {
        tokens[editor.email] = res.json("access_token");
        break;
      }
      // Supabase limits sign-ins per address; wait and try again.
      if (res.status === 429 && attempt < 6) {
        sleep(20);
        continue;
      }
      throw new Error(`Sign-in failed for ${editor.email}: ${res.status} ${res.body}`);
    }
    sleep(1);
  }
  return { tokens };
}

// ---------------------------------------------------------------------------
// Visitors
// ---------------------------------------------------------------------------
export function visitor() {
  const slug = data.slugs[Math.floor(Math.random() * data.slugs.length)];
  const page = http.get(`${BASE_URL}/p/${slug}`, {
    headers: BROWSER,
    tags: { kind: "page", name: "/p/[slug]" },
  });
  check(page, {
    "page 200": (r) => r.status === 200,
    "page complete": (r) => typeof r.body === "string" && r.body.includes("pk-root"),
  });
  sleep(1 + Math.random());
  const view = http.post(`${BASE_URL}/api/view?slug=${slug}`, null, {
    headers: BROWSER,
    tags: { kind: "view", name: "/api/view" },
  });
  check(view, { "view 204": (r) => r.status === 204 });
  sleep(3 + Math.random() * 4); // reading the page
}

// ---------------------------------------------------------------------------
// Editors: like the real editor, load the document once, then save the whole document after
// each pause, only if nobody saved since (updated_at check).
// ---------------------------------------------------------------------------
let mine = null; // this fake user's portfolio, token and last save time

function rest(path) {
  return `${SUPABASE_URL}/rest/v1/${path}`;
}
function authHeaders(token, extra) {
  return Object.assign({ apikey: SUPABASE_KEY, authorization: `Bearer ${token}` }, extra || {});
}

function load(token, id) {
  const res = http.get(rest(`portfolios?id=eq.${id}&select=doc,updated_at`), {
    headers: authHeaders(token),
    tags: { kind: "load", name: "load portfolio" },
  });
  check(res, { "load 200": (r) => r.status === 200 && r.json().length === 1 });
  const row = res.json()[0];
  return { doc: row.doc, updatedAt: row.updated_at };
}

export function editor(setupData) {
  if (!mine) {
    const slot = portfolios[(exec.vu.idInTest - 1) % portfolios.length];
    const token = setupData.tokens[slot.email];
    mine = Object.assign({ id: slot.id, token, edits: 0 }, load(token, slot.id));
  }
  // Typing, then the 1.5 s pause that triggers a save.
  sleep(6 + Math.random() * 4);
  mine.edits += 1;
  mine.doc.meta.description = `Load test edit ${mine.edits} at ${new Date().toISOString()}`;
  const res = http.patch(
    rest(
      `portfolios?id=eq.${mine.id}&updated_at=eq.${encodeURIComponent(mine.updatedAt)}&select=updated_at`,
    ),
    JSON.stringify({ doc: mine.doc }),
    {
      headers: authHeaders(mine.token, {
        "content-type": "application/json",
        prefer: "return=representation",
      }),
      tags: { kind: "save", name: "save portfolio" },
    },
  );
  check(res, { "save 200": (r) => r.status === 200 });
  const rows = res.status === 200 ? res.json() : [];
  if (rows.length === 1) {
    mine.updatedAt = rows[0].updated_at;
  } else if (res.status === 200) {
    // Someone else saved this portfolio (two fake users on one portfolio): reload, like the app.
    saveConflicts.add(1);
    Object.assign(mine, load(mine.token, mine.id));
  }

  // Now and then the owner opens the dashboard: 12 newest portfolios and the unread count.
  if (Math.random() < 0.1) {
    const list = http.get(
      rest(
        "portfolios?select=id,title,status,slug,updated_at,doc&order=updated_at.desc,id.asc&limit=12",
      ),
      {
        headers: authHeaders(mine.token, { prefer: "count=exact" }),
        tags: { kind: "dashboard", name: "dashboard list" },
      },
    );
    check(list, { "dashboard 200": (r) => r.status === 200 || r.status === 206 });
    const unread = http.post(rest("rpc/unread_message_count"), "{}", {
      headers: authHeaders(mine.token, { "content-type": "application/json" }),
      tags: { kind: "dashboard", name: "unread count" },
    });
    check(unread, { "unread 200": (r) => r.status === 200 });
  }
}

// ---------------------------------------------------------------------------
// Spam robots: no spam-check token, so every post must be refused (403) without touching the
// database.
// ---------------------------------------------------------------------------
export function spammer() {
  const slug = data.slugs[Math.floor(Math.random() * data.slugs.length)];
  const res = http.post(
    `${BASE_URL}/api/contact?slug=${slug}`,
    { name: "Robot", email: "robot@loadtest.example.com", message: "Buy followers now" },
    {
      headers: Object.assign({ accept: "application/json" }, BROWSER),
      tags: { kind: "spam", name: "/api/contact (no token)" },
      responseCallback: http.expectedStatuses(403),
    },
  );
  spamRefused.add(res.status === 403);
  sleep(2);
}

// ---------------------------------------------------------------------------
// Report: printed summary plus a JSON file in loadtest/results.
// ---------------------------------------------------------------------------
export function handleSummary(summary) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    stdout: textSummary(summary, { indent: "  ", enableColors: true }),
    [`loadtest/results/summary-${stamp}.json`]: JSON.stringify(summary, null, 2),
  };
}
