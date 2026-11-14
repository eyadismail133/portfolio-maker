# 07 - Supabase setup

Do these steps once in the Supabase dashboard for the project in `.env.local`. Until step 1 is done, login works but the dashboard shows "The database is not set up yet".

## 1. Create the tables (required)
1. Open the project, then **SQL Editor** and **New query**.
2. Paste the whole file `supabase/migrations/0001_init.sql` and press **Run**.
3. Check **Table Editor**: `profiles`, `portfolios`, `assets` and `onboarding_answers` exist, each marked "RLS enabled".
4. Check **Storage**: a public bucket named `portfolio-images` exists.

5. Do the same with `supabase/migrations/0002_publishing.sql`, then `0003_ai_and_permissions.sql`, then `0004_plans_and_billing.sql`, then `0005_reports.sql`, then `0006_signups_domains_errors.sql`, then `0007_publish_replacing.sql`, then `0008_hardening.sql`. Together they add publishing, contact messages, visit counts and version history. Then check that `form_submissions`, `page_views`, `portfolio_versions`, `newsletter_signups`, `custom_domains` and `error_log` exist.

Run each file **once, in order**. Never run an older file again after a newer one: newer files change functions that older files create, and running an old file again would undo that. Later database changes will come as new numbered files.

## 2. Tell Supabase where the app lives (required)
**Authentication** then **URL Configuration**:
- **Site URL:** `http://localhost:3000` while developing; change it to the Vercel address when the site is live.
- **Redirect URLs:** add `http://localhost:3000/**` and `https://YOUR-VERCEL-ADDRESS/**`.

Without this, the links in confirmation and password emails, and Google sign-in, send people to the wrong place.

## 3. Email confirmation (choose)
**Authentication**, **Sign In / Providers**, **Email**:
- "Confirm email" on (the default): new accounts must click a link in an email first. Supabase's built-in email sender allows only a few emails per hour, so add your own SMTP sender before real users arrive.
- "Confirm email" off: new accounts are logged in immediately. Easier while testing.

## 4. Google sign-in (optional)
1. In Google Cloud Console create an OAuth client of type "Web application". As the authorised redirect URI use the callback address Supabase shows under **Authentication**, **Sign In / Providers**, **Google**.
2. Paste the client ID and secret into that Supabase page and enable the provider.

Until this is done, the "Continue with Google" button shows a message that Google sign-in is not switched on.

## 5. Vercel
Add the two values from `.env.local` under **Settings**, **Environment Variables** in the Vercel project, then redeploy.

## What the security rules do
- Every table has row level security: an account can read and change only its own rows.
- Visitors never read tables directly. They go through four functions: read a published page, check a link name, send a contact message (published pages only, 30 an hour), count a visit. None of them can reveal a draft.
- An account cannot change its own `plan`, and cannot ask whether another account is Pro.
- Free accounts cannot read locked messages, even through the API.
- The image storage limit counts the files actually stored, so it cannot be dodged by skipping or deleting image records.
- Uploaded images go to the folder named after the account's id; nobody can write into another account's folder. Images are public to read, because published portfolios show them.
- The bucket accepts only images, 5 MB at most. The app shrinks images to 2000 pixels and converts them to WebP before uploading.

## 6. AI writing (optional, Pro accounts only)
1. Get a free API key from Google AI Studio (https://aistudio.google.com/apikey).
2. Add it as `AI_API_KEY` in `.env.local` and in Vercel. `AI_BASE_URL` and `AI_MODEL` can stay at the values in `.env.example`. `AI_MODEL` lists models to try in order: on 13 November 2026 Google's bigger Flash models were overloaded on the free tier, while `gemini-3.1-flash-lite` answered in about a second with good Arabic.
3. Give your own account Pro to try it, in the SQL editor:
   `update public.profiles set plan = 'pro' where id = (select id from auth.users where email = 'you@example.com');`

To use Groq instead (also free): `AI_BASE_URL=https://api.groq.com/openai/v1` and `AI_MODEL=llama-3.3-70b-versatile`, with a Groq key.

Free tiers have daily limits for the whole site and can change without notice. Google's terms let it use what is sent on the free tier to improve its products, so do not promise users their text stays private while on the free tier. Each Pro account can use AI 50 times a day.

## 7. Payments with Paymob (when your Paymob account is ready)
1. Run `0004_plans_and_billing.sql` (step 5).
2. In Supabase: **Project Settings**, **API Keys**, copy the **secret** key. Put it in `.env.local` and Vercel as `SUPABASE_SECRET_KEY`. Never share it or put it in code: it bypasses all security rules. The app uses it only in the payment webhook.
3. In the Paymob dashboard get the **secret key**, **public key** and **HMAC secret**, and the **integration IDs** for the methods you want (card, mobile wallet, kiosk). Put them in `.env.local` and Vercel:
   `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS` (comma separated). For dollars, also `PAYMOB_USD_INTEGRATION_IDS` with a USD-enabled integration (ask Paymob to enable USD).
4. Test with Paymob's **test** keys and test integration IDs first (test cards from Paymob's docs), then switch to live keys.
5. Paymob is told the callback address automatically with each payment (`https://YOUR-SITE/api/billing/paymob`), so the site must be reachable from the internet: test on Vercel, not on localhost.

Until steps 2 and 3 are filled in, `/pro` says "Payments open soon" and nothing can be bought.

## 8. Legal pages and reports
- Add `NEXT_PUBLIC_LEGAL_NAME` (your business or your own name) and `NEXT_PUBLIC_CONTACT_EMAIL` (where people write about privacy, refunds and reports) in `.env.local` and Vercel. Until then the terms, privacy and refund pages show "[business name]" and "[contact email]".
- The texts in `src/app/terms`, `src/app/privacy` and `src/app/refunds` are a plain-language starting point, not legal advice. Have a lawyer in Egypt review them before taking real payments. The refund rule (full refund within 14 days of the first purchase) is a suggested default: change it if you want something else.
- Visitors' reports land in the `abuse_reports` table. Read them in the Table Editor; mark them `reviewed` or `actioned` in the `status` column. To take a page offline, set its portfolio's `status` to `draft` in the `portfolios` table.

## 9. Emails, daily job, custom domains, error log and backups (optional)
All of these are off until their settings exist; nothing breaks without them. Add each setting in `.env.local` and in Vercel (Settings → Environment Variables), then redeploy.
- **Emails** (new message, receipt after payment, "Pro ends in 3 days"): make a free account at resend.com, verify your domain there, then set `RESEND_API_KEY` and `EMAIL_FROM` (for example `Portfolio Maker <hello@yourdomain.com>`). Emails also need `SUPABASE_SECRET_KEY`, which is already set for payments. Optional `NEXT_PUBLIC_SITE_URL` (your app's address) for the links inside emails.
- **Daily job** (`vercel.json`, every day at 07:17 UTC): set `CRON_SECRET` to a long random string. It sends the Pro reminders and clears error-log rows older than 30 days. Vercel's free plan allows one daily job.
- **Custom domains (Pro):** run `0006_signups_domains_errors.sql` (step 1), then set `VERCEL_TOKEN` (Vercel → Account settings → Tokens), `VERCEL_PROJECT_ID` (project → Settings → General) and, if the project is in a team, `VERCEL_TEAM_ID`. Pro owners then connect a domain in the Publish window; it shows the DNS records to add and turns on by itself once the DNS is right. When Pro ends, the domain stops showing the page.
- **Error log:** after 0006, server errors are written to `error_log` (message, path and kind only). Read them with `select * from public.error_log order by created_at desc limit 50;`.
- **Backups:** on GitHub, open the repository → Settings → Secrets and variables → Actions → New repository secret named `SUPABASE_DB_URL`, with the "Session pooler" connection string from Supabase (Connect button), password filled in. `.github/workflows/backup.yml` then saves a database dump every night, kept 14 days under the Actions tab. The dump holds user data, so keep the repository private. Run it once by hand (Actions → Nightly database backup → Run workflow) to check it works. Supabase's free plan has no backups of its own.

## Check of the live project (13 November 2026)

Second check, after the owner ran 0003 and 0004: the new tables and columns exist, and visitors are refused by `is_slug_available`, `is_pro` and `apply_paid_payment`. Vercel deploys from GitHub.

First check:
Checked from the browser with the publishable key:
- All 7 tables exist and return nothing to visitors without an account (row security works).
- The image bucket exists.
- The visitor functions answer correctly: reading a page that does not exist returns nothing, a contact message to it returns "not_found", counting a visit works.
- Email sign-up is on, with email confirmation; Google sign-in is off.
- **Found and fixed:** visitors without an account could call `is_slug_available`. Supabase gives new functions to the "anon" role directly, so `0003_ai_and_permissions.sql` removes that. Run it.
- **Not checked:** the Site URL and Redirect URLs (step 2), because the dashboard was not signed in. Please confirm them.

## Not verified yet
Logging in, saving and publishing with real accounts have not been tried against the live project yet; the app was tested end to end against a stand-in for Supabase.
