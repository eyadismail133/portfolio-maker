# 07 - Supabase setup

Do these steps once in the Supabase dashboard for the project in `.env.local`. Until step 1 is done, login works but the dashboard shows "The database is not set up yet".

## 1. Create the tables (required)
1. Open the project, then **SQL Editor** and **New query**.
2. Paste the whole file `supabase/migrations/0001_init.sql` and press **Run**.
3. Check **Table Editor**: `profiles`, `portfolios`, `assets` and `onboarding_answers` exist, each marked "RLS enabled".
4. Check **Storage**: a public bucket named `portfolio-images` exists.

5. Do the same with `supabase/migrations/0002_publishing.sql`. It adds publishing, contact messages, visit counts and version history. Then check that `form_submissions`, `page_views` and `portfolio_versions` exist.

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

## Not verified yet
The SQL was written and reviewed but has not been run against a real Supabase project, and the app was tested against a stand-in for Supabase, not the real service. The first real run of steps 1 and 2 is the test.
