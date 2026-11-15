# Load test

Three steps: fill the database with fake data, run k6, remove the fake data. Run everything from the
project folder. The scripts read `.env.local`, so nothing has to be typed in.

## 1. Fake data

```bash
npm run loadtest:seed -- --dry-run   # shows what it would create, writes nothing
npm run loadtest:seed                # creates it (a few minutes)
```

Default: 200 Free accounts (3 portfolios each, 1 published as `/p/loadtest-0` … `/p/loadtest-199`),
20 Pro "editor" accounts with 15 drafts each (the k6 editors sign in as these), 20,000 messages,
5,000 newsletter sign-ups and 30 days of visit counts. About 23 MB of the Free plan's 500 MB.
Change sizes with `--accounts=`, `--editors=`, `--drafts=`, `--messages=`, `--signups=`, `--days=`.
The k6 test gives every fake user its own draft, so it needs at least as many drafts in total
(editors × drafts) as fake users: 143 at `SCALE=1`, 283 at `SCALE=2` (seed with `--drafts=15` for both).

Every fake account's email is `loadtest-…@loadtest.example.com`. Accounts are created already
confirmed, so **no emails are sent**. Creating accounts does not count as monthly active users; only
the 20 editors that sign in during the test do.

The password and the list of pages go to `loadtest/.loadtest-data.json`, which git ignores.

## 2. Run k6

Install k6 once (Windows):

```bash
winget install k6 --source winget
```

Then, in a new terminal:

```bash
k6 run loadtest/k6-test.js
```

With a live web dashboard and an HTML report saved at the end:

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=loadtest/results/report.html k6 run loadtest/k6-test.js
```

(In PowerShell: `$env:K6_WEB_DASHBOARD="true"; $env:K6_WEB_DASHBOARD_EXPORT="loadtest/results/report.html"; k6 run loadtest/k6-test.js`.)
The dashboard opens at http://localhost:5665 while the test runs.

### What it does (about 6 minutes)

| Group | Users | What each does |
|---|---|---|
| Visitors | 100 | Open a random fake published page, count the visit, read for 4–8 s, repeat |
| Editors | 40 | Signed in; save their portfolio every 6–10 s like the real editor; 1 in 10 times also open the dashboard |
| Spam robots | 3 | Post the contact form without the spam check every 2 s; every post must be refused (403) |

Users ramp up for 1 minute, stay for 4 minutes and ramp down for 1 minute.
`SCALE=2 k6 run …` doubles visitors and editors. The test asks for compressed pages like a real
browser; without that, the first run downloaded about 4 times more than real visitors would and
filled the test computer's own connection.

### How much of the free plans one run uses (default size)

| Meter | One run | Compared with |
|---|---|---|
| Vercel function calls | about 9,000 | Hobby's monthly allowance is far larger; check your Usage page |
| Vercel data transfer | about 0.1–0.2 GB (compressed) | Hobby includes 100 GB a month |
| Supabase API requests | about 6,000 | not a Free plan meter |
| Supabase egress | well under 0.1 GB | Free includes 5 GB a month for the organization |
| Supabase database size | about 23 MB while seeded | Free includes 500 MB; removed by cleanup |
| Supabase monthly active users | 20 | Free includes 50,000 |

Plans and allowances change; glance at both Usage pages before and after. Stay at `SCALE` 2 or
below on the free plans. The test stops itself if more than 10% of requests fail, so a broken run
does not keep using the allowances.

### Your connection is part of the test

k6 runs on your computer, so a slow or busy home connection makes every request look slow, even
ones the server answers in milliseconds. If p95 times are high in every group at once (including
the spam robots, which never touch the database) while Vercel and Supabase look calm, the limit was
the connection: lower `SCALE` (for example `0.5`), or run k6 from a cloud server.

### Where to look during the run

Note the start and end time, then look at the same minutes in:

- **k6 summary / HTML report:** what users felt: p95 times per group, errors, requests per second.
- **Vercel → project → Observability** (and **Logs**): function time and errors per route.
- **Supabase → project → Observability / Reports:** database CPU, memory, connections, API requests.
- **Supabase → Query Performance:** the slowest queries during the run.

Usage pages only show monthly totals, refreshed about hourly: use them afterwards to see how much
the run used, not to judge speed.

### Reading the result

- Green thresholds in the summary: each group stayed under its target
  (pages p95 < 1 s, visit count < 0.8 s, saves and dashboard < 1.5 s, spam refused 99%+).
- `save_conflicts` above 0 only means two fake editors shared one portfolio; it is handled like in
  the app and is not an error.
- If times climb while Supabase CPU stays high, the database is the limit (next step: a bigger
  compute size). If times climb while database CPU stays low, look at Vercel function time.
- Vercel's firewall may block traffic from one computer that looks like an attack. If many requests
  fail with 403 or 429 on pages, lower `SCALE` or allow your IP in Vercel → Firewall.

## 3. Remove the fake data

```bash
npm run loadtest:cleanup -- --dry-run   # counts fake and real accounts, removes nothing
npm run loadtest:cleanup                # removes every fake account and everything it owned
```

Only accounts whose email is `loadtest-…@loadtest.example.com` are removed. Deleting an account
removes its portfolios, versions, messages, sign-ups and visit counts with it. Run cleanup even if
the seed or the test stopped half way.
