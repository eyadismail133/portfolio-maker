# Working rules for this project

Read `README.md` first, then the doc for the area you are touching. The plan lives in `docs/`; the task list is `docs/06-ROADMAP.md`.

## Before you start
- Find the current phase in `docs/06-ROADMAP.md` and work on the first unticked task unless told otherwise.
- Do not start a later phase while an earlier one has unticked tasks, except where the roadmap says phases can run in parallel.

## While you work
- **Stack:** Next.js (App Router), TypeScript strict mode, Tailwind for the app interface, Supabase, Zustand, Zod. Do not add another framework or UI library without asking.
- **Two separate worlds, never mix them:**
  - `src/app` and `src/components` = the app (dashboard, editor). Styled with Tailwind.
  - `src/render-kit` = the portfolio pages users create. Styled with its own plain CSS and CSS variables only. No Tailwind, no app imports, no Next.js-only features. It must work as plain exported HTML.
- **The portfolio document is the single source of truth.** Every editor action is a change to that JSON. Never store design or content anywhere else.
- **Every section** must: be listed in the section registry, have a Zod schema and default content, support every design family through theme variables (no hard-coded colors or fonts), work from 360px wide to desktop, and work in right-to-left (use CSS logical properties: `margin-inline-start`, not `margin-left`).
- **Changing the document shape** requires bumping `schemaVersion` and adding a migration function. Never break saved portfolios.
- Images go through the upload helper (resize, convert to WebP). Never store an image as base64 in the document.
- User text is always escaped when rendered. Rich text is sanitized. Published pages run no user-written scripts.

## When you finish a task
- Run `npm run lint`, `npm run typecheck`, `npm test`.
- Tick the task in `docs/06-ROADMAP.md`.
- If you made a decision the docs do not cover, add it to the matching doc in the same change. Docs and code must agree.

## Naming
- Section types: lowercase with dashes (`hero`, `work-experience`). Variants: `hero.split`, `hero.centered`.
- Components: PascalCase files. Everything else: kebab-case.
- Commits: short, present tense, start with the area: `render-kit: add timeline section`.
