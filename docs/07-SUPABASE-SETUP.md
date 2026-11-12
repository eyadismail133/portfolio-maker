# 07 - Supabase setup

Do these steps once in the Supabase dashboard for the project in `.env.local`. Until step 1 is done, login works but the dashboard shows "The database is not set up yet".

## 1. Create the tables (required)
1. Open the project, then **SQL Editor** and **New query**.
2. Paste the whole file `supabase/migrations/0001_init.sql` and press **Run**.
3. Check **Table Editor**: `profiles`, `portfolios`, `assets` and `onboarding_answers` exist, each marked "RLS enabled".
4. Check **Storage**: a public bucket named `portfolio-images` exists.

5. Do the same with `supabase/migrations/0002_publishing.sql`, then `0003_ai_and_permissions.sql`. It adds publishing, contact messages, visit counts and version history. Then check that `form_submissions`, `page_views` and `portfolio_versions` exist.

Both files are safe to run again. Later database changes will come as new numbered files; run each one once, in order.

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
- An account cannot change its own `plan`.
- Uploaded images go to the folder named after the account's id; nobody can write into another account's folder. Images are public to read, because published portfolios show them.
- The bucket accepts only images, 5 MB at most. The app shrinks images to 2000 pixels and converts them to WebP before uploading.

## 6. AI writing (optional, Pro accounts only)
1. Get a free API key from Google AI Studio (https://aistudio.google.com/apikey).
2. Add it as `AI_API_KEY` in `.env.local` and in Vercel. `AI_BASE_URL` and `AI_MODEL` can stay at the values in `.env.example`.
3. Give your own account Pro to try it, in the SQL editor:
   `update public.profiles set plan = 'pro' where id = (select id from auth.users where email = 'you@example.com');`

To use Groq instead (also free): `AI_BASE_URL=https://api.groq.com/openai/v1` and `AI_MODEL=llama-3.3-70b-versatile`, with a Groq key.

Free tiers have daily limits for the whole site and can change without notice. Google's terms let it use what is sent on the free tier to improve its products, so do not promise users their text stays private while on the free tier. Each Pro account can use AI 50 times a day.

## Check of the live project (13 November 2026)
Checked from the browser with the publishable key:
- All 7 tables exist and return nothing to visitors without an account (row security works).
- The image bucket exists.
- The visitor functions answer correctly: reading a page that does not exist returns nothing, a contact message to it returns "not_found", counting a visit works.
- Email sign-up is on, with email confirmation; Google sign-in is off.
- **Found and fixed:** visitors without an account could call `is_slug_available`. Supabase gives new functions to the "anon" role directly, so `0003_ai_and_permissions.sql` removes that. Run it.
- **Not checked:** the Site URL and Redirect URLs (step 2), because the dashboard was not signed in. Please confirm them.

## Not verified yet
Logging in, saving and publishing with real accounts have not been tried against the live project yet; the app was tested end to end against a stand-in for Supabase.
