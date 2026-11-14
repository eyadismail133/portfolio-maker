# Working rules for this project

Read `README.md` first, then the doc for the area you are touching. The plan lives in `docs/`; the task list is `docs/06-ROADMAP.md`.

## Before you start
- Find the current phase in `docs/06-ROADMAP.md` and work on the first unticked task unless told otherwise.
- Do not start a later phase while an earlier one has unticked tasks, except where the roadmap says phases can run in parallel.

## While you work
- **Stack:** Next.js (App Router), TypeScript strict mode, Tailwind and Motion (`motion/react`, timings from `src/lib/motion.ts`) for the app interface, Supabase, Zustand, Zod. Do not add another framework or UI library without asking.
- **Two separate worlds, never mix them:**
  - `src/app` and `src/components` = the app (dashboard, editor). Styled with Tailwind.
  - `src/render-kit` = the portfolio pages users create. Styled with its own plain CSS and CSS variables only. No Tailwind, no app imports, no Next.js-only features. It must work as plain exported HTML.
- **The portfolio document is the single source of truth.** Every editor action is a change to that JSON. Never store design or content anywhere else.
- **Every section** must: be listed in the section registry, have a Zod schema and default content, support every design family through theme variables (no hard-coded colors or fonts), work from 360px wide to desktop, and work in right-to-left (use CSS logical properties: `margin-inline-start`, not `margin-left`).
- **Changing the document shape** requires bumping `schemaVersion` and adding a migration function. Never break saved portfolios.
- Images go through the upload helper (resize, convert to WebP). Never store an image as base64 in the document.
- User text is always escaped when rendered. Rich text is sanitized. Published pages run no user-written scripts.

## Render kit rules learned the hard way
- Every class starts with `pk-`. The Renderer gives each section wrapper the classes `pk-<type>` and `pk-<type>--<variant>`, so never reuse those two names for elements inside the section (use `pk-<type>__list` and so on).
- Colors used in section CSS are the section variables (`--pk-bg`, `--pk-text`, `--pk-primary`...), never `--pk-c-*` or `--pk-l-*`, so colored sections keep working. The one exception is the banner in `cta.css`.
- A CSS variable that refers to a section color (for example `--pk-rule`) must be declared on `.pk-section`, not on `.pk-root`.
- New section: add its folder, add it to `sections/index.ts`, add its CSS to `styles/index.css`. The tests then check it in every variant, in both languages, and with empty content.
- `src/render-kit/generated/page-css.ts` is made by `npm run css`; never edit it by hand. Commit it together with any CSS change.
- `render-kit/page-script.ts` is the only script on a portfolio page. Anything it adds must be an extra: the page must work without it. The one exception: with the spam check on, inbox forms need it (`docs/03-ARCHITECTURE.md`).
- Look at the result: `npm run samples` writes plain HTML files, and `/dev/render` shows the same pages with switches.

## When you finish a task
- Run `npm run lint`, `npm run typecheck`, `npm test`.
- Tick the task in `docs/06-ROADMAP.md`.
- If you made a decision the docs do not cover, add it to the matching doc in the same change. Docs and code must agree.

## Naming
- Section types: lowercase with dashes (`hero`, `work-experience`). Variants: `hero.split`, `hero.centered`.
- Components: PascalCase files. Everything else: kebab-case.
- Commits: short, present tense, start with the area: `render-kit: add timeline section`. The message describes the updates only: no mention of AI tools or assistants, no co-author or session lines.
- Database changes go in a new numbered file in `supabase/migrations/`; never edit a migration that was already run. Every table needs row level security.
- `supabase/__tests__/database.test.ts` runs all migrations in a real Postgres (PGlite) and checks the rules as visitor, account and server. Add a check there for every new rule or limit.
- Plan limits live in two places that must agree: `src/lib/plans.ts` and the newest migration that defines each limit's function; a test compares them. The database is what enforces them.
- Payments are trusted only from a Paymob callback with a valid HMAC. Never grant Pro from the browser.
- Supabase helpers live in `src/lib/supabase` (`client.ts`, `server.ts`, `proxy.ts`). Next.js 16 names the middleware file `src/proxy.ts`.
