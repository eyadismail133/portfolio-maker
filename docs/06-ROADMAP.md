# 06 - Roadmap

Tick tasks as they are finished (`[-]` means skipped on purpose, with the reason). Each phase ends with something you can see working. Sizes are rough, for one developer working with AI help.

## Phase 0 - Setup (1 to 2 days)
- [x] Confirm the decisions in `README.md` (defaults accepted on 2026-11-12)
- [x] Create Next.js + TypeScript + Tailwind project, lint, format, test tools
- [x] Supabase client code and `.env.example`
- [x] Folder structure from `03-ARCHITECTURE.md`
- [x] Local git repository with first commit
- [x] Create the Supabase project and fill in `.env.local`
- [x] Session refresh in `src/proxy.ts`
- [x] Push to GitHub (`eyadismail133/portfolio-maker`)
- [x] First deploy to Vercel (deploys from GitHub on every push)

**Result:** empty app online.

## Phase 1 - Render kit (1.5 to 2 weeks)
The core. No login, no editor yet; work with JSON files.
- [x] Zod schema and types for the portfolio document, with `schemaVersion` and migration helper
- [x] Section registry and `Renderer`
- [x] Theme system: CSS variables, palette builder from one brand color, contrast check
- [x] First design family: `minimal`
- [x] First 12 sections: navbar, hero, about, work-experience, education, skills, languages, projects, testimonials, contact, cta, footer (at least 2 variants each)
- [x] Right-to-left layout and Arabic sample content
- [x] Check the Arabic web fonts in a real browser (13 Nov 2026: all 15 font links answer with Arabic faces, and all 12 Arabic families load and render)
- [x] Demo page `/dev/render` that shows sample documents, with switches for family, palette, direction, screen size
- [x] Add families: `bold`, `elegant`, `tech`, `corporate`, `creative`
- [x] One-step family switch that keeps content (`themes/apply.ts`)
- [x] Remaining version 1 sections (27 more): all 39 version 1 sections exist, each with at least 2 layouts
- [x] Section extras that need a small script: gallery lightbox, counting numbers in `stats`, sending the contact form without leaving the page (`render-kit/page-script.ts`)
- [x] Newsletter form: send sign-ups to the inbox too (migration 0006; CSV download in the inbox)
- [x] 24 palettes and 15 font pairs
- [x] Visual check: `npm run visual` opens every section in every family, both languages, phone and desktop; it fails on sideways scrolling or empty sections and saves screenshots
- [x] Compare screenshots against saved good ones automatically (`npm run visual -- --update`, then `-- --compare`)

**Result:** any sample JSON becomes a beautiful page in 6 designs.

## Phase 2 - Editor and preview (2 weeks)
- [x] Editor store with actions, undo/redo
- [x] Editor layout, preview frame with `postMessage` sync
- [x] Sections tab: list, reorder (drag or buttons), hide, duplicate, delete, add from library
- [x] Automatic forms from section `fields`, all field types
- [x] Variant picker
- [x] Design tab: family, palettes, brand color, light/dark, fonts, corners, spacing, shuffle
- [x] Select section by clicking in preview
- [x] Device size switch
- [x] Settings tab: page title, description, languages
- [x] Save to browser storage for now
- [x] Section toolbar inside the preview (move, duplicate, delete)
- [x] Live previews of each layout and each design family in the pickers, using the person's own content
- [x] Editing each palette color by hand, with a warning for hard-to-read colors
- [x] Editor layout for phones and small tablets (panel slides in, section form as a bottom sheet)
- [x] More keyboard shortcuts: Delete, Ctrl+D, Ctrl+S (also while the preview has focus)
- [x] Share image and favicon in Settings (the link name is chosen in the Publish dialog)
- [x] Rich text (bold, italic, links, lists) in long text fields: `**bold**`, `*italic*`, `[text](url)` and `- ` lists, with a format bar; stored as plain text, rendered escaped

**Result:** full editing works locally without an account. Open `/editor`.

## Phase 3 - Accounts and saving (1 week)
- [x] Database tables and row security (`supabase/migrations/0001_init.sql`)
- [x] Sign up, log in, Google, password reset, protected routes
- [x] Dashboard: list, create, rename, duplicate, delete
- [x] Autosave to database with saved indicator, offline copy and "changed elsewhere" check
- [x] Image upload: resize, WebP
- [x] Run the setup in `docs/07-SUPABASE-SETUP.md` (done by the owner; checked on 13 November 2026, one permission fixed in `0003`)
- [x] Run `0003` and `0004` (checked live on 13 November 2026)
- [ ] Confirm the Site URL and Redirect URLs, and try a real sign-up (owner)
- [x] Image crop tool (ratios, zoom, drag or arrow keys; runs before upload)
- [x] Media library to reuse uploaded images ("My images" on every image field)
- [x] Account page: name, password, plan, storage used, payment history, delete account (`/account`)

**Result:** users keep their work.

## Phase 4 - Onboarding and ideas (1 week)
- [x] Question screens (8 steps) with progress, back, skip
- [x] Recipes for each user type and goal
- [x] Sample content for 10 fields, in English and Arabic (hero, about, skills, services)
- [x] Idea generator: answers in, 6 documents out
- [x] Ideas screen with live mini previews, "6 more", "start blank"
- [x] Save answers
- [x] Try without an account: the chosen idea waits in the browser and is saved after login
- [x] Field-specific sample text for the business sections: how it works, FAQ and case study for all ten fields (team, pricing and partners keep one general example that is clearly sample text)
- [x] Photo or logo upload in the last question (kept in the browser until login, then uploaded and placed in the hero or navbar)

**Result:** the full main idea works: login, questions, ideas, edit.

## Phase 5 - Publish and export (1 week)
- [x] Publish flow: link name with live availability check, checklist, `published_doc` (`supabase/migrations/0002_publishing.sql`)
- [x] Public page `/p/[slug]` (and `/p/[slug]/ar` for the second language) with caching, SEO tags, share image
- [x] HTML zip export (one file per language, styles, script, images), tested offline
- [x] Dashboard thumbnail: a live scaled-down preview instead of a stored image
- [x] Share: copy link, QR code
- [x] Take offline (unpublish)
- [x] Marketing home page with example portfolios
- [x] Run `0002_publishing.sql`
- [ ] Test publishing with a real account on the live project (owner)
- [x] Unknown or offline pages answer with a real 404 status (checked in `src/proxy.ts` before the page streams)

**Result:** version 1 complete. Test with 5 to 10 real people before going further.

## Phase 6 - Power features (ongoing, pick by user feedback)
- [x] Working contact form + inbox (`/dashboard/inbox`), with spam trap and 30 messages an hour per page
- [x] Visitor statistics: visits in the last 30 days on each dashboard card
- [x] Scroll animations: the "lively" animation setting fades sections in; numbers count up
- [x] Version history: saved on every publish and by hand, newest 30 kept, restore is undoable
- [x] 6 more design families (playful, editorial, brutalist, glass, gradient, classic CV)
- [x] Remaining "later" sections (publications, before and after, careers, booking)
- [x] Edit text directly in the preview (double-click plain text; marked-up text opens in the form)
- [x] CV / LinkedIn import to fill data (Pro: PDF read in the browser with pdf.js, text turned into sections by the AI, shown before it is applied, one Undo step)
- [x] AI writing help for Pro accounts: first draft, improve, shorten, translate between English and Arabic; free model (Google Gemini by default, any OpenAI-format service), 50 uses a day
- [x] Add the AI key in `.env.local` (Vercel: owner)
- [x] PDF CV download from the same data (Pro: an A4 page at /editor/[id]/cv; the browser's print dialog saves the PDF)
- [x] Dark/light switch for visitors
- [x] Email the owner when a message arrives (Resend; at most one email per page every 10 minutes)
- [x] App interface in Arabic (dictionary keyed by the English text, cookie switch, right to left; legal pages stay English until reviewed)

## Phase 7 - Launch and business
- [x] Decide plans, prices and the payment provider (`docs/08-PLANS-AND-PAYMENTS.md`): 250 EGP or 6 USD a month, prepaid months, Paymob
- [x] Payments: payments table, Paymob checkout, signed webhook, Go Pro page and result page (`0004_plans_and_billing.sql`)
- [x] Enforce the Free and Pro limits (database first, friendly messages in the app)
- [x] Remove badge for paid plan
- [x] Database tests: every migration runs in a real Postgres in `npm test` (`supabase/__tests__`)
- [x] Run `0004` (checked live on 13 November 2026)
- [x] Run `0005`
- [ ] Run `0006`; test a payment with Paymob test keys on Vercel (owner)
- [x] Account page with payment history
- [x] Receipts (email after payment, and a printable receipt page in Account)
- [x] Emails: receipt, Pro ending soon (daily job in vercel.json)
- [-] Auto-renewing card subscriptions: skipped on purpose. Prepaid months work with every Paymob method (cards, wallets, kiosks), never charge anyone by surprise, and need no card storage or cancel flow. Revisit only if many people ask for it.
- [x] Custom domains (Pro; Vercel API, verified by the server, stop when Pro ends)
- [x] Terms, privacy and refund pages; "Report this page" on published pages (`0005_reports.sql`)
- [x] Set `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_CONTACT_EMAIL`
- [ ] Have a lawyer review the terms, privacy and refund texts (owner)
- [x] Error monitoring and backups (error_log table via instrumentation; nightly pg_dump GitHub Action)
- [x] Template gallery page for SEO (/templates, plus sitemap.xml and robots.txt)

## Risks to watch
| Risk | How we handle it |
|---|---|
| Sections x families x variants is a lot of design work | Families are mostly variable values; screenshot tests catch breakage; ship 6 families first |
| Exported HTML differs from preview | Same Renderer everywhere; export is tested in Phase 5 |
| Document shape changes break old portfolios | `schemaVersion` + migrations from day one |
| Scope grows before launch | Phase 6 stays closed until Phase 5 is tested with real users |
