# Portfolio Maker

A website where anyone can build a rich portfolio landing page (personal profile, company, startup, freelancer, agency...) without design skills: log in, answer a few questions, pick a starting idea, fill in the data, adjust design and colors with a live preview, then publish or download as HTML.

**Status:** Phase 0 is done except the Vercel deploy. Next is Phase 1 in `docs/06-ROADMAP.md`.

## Run it on your computer

You need Node.js 22 or newer.

```
npm install
copy .env.example .env.local     (then fill in the Supabase values)
npm run dev                      (open http://localhost:3000)
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development |
| `npm run build` | Production build |
| `npm run lint` | Check code style rules |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run tests |
| `npm run format` | Format the code |

## How to use these files

| File | What it is for | Read it when |
|---|---|---|
| `CLAUDE.md` | Rules for anyone (human or AI) working on the code | Start of every work session |
| `docs/01-PRODUCT.md` | What we build, for whom, and why it beats Canva | Deciding if a feature belongs |
| `docs/02-USER-FLOW.md` | Login, onboarding questions, starter ideas, screens | Building any page |
| `docs/03-ARCHITECTURE.md` | Tech stack, folder structure, database, the portfolio document | Writing any code |
| `docs/04-SECTIONS-AND-DESIGNS.md` | All landing page sections, variants, design families, palettes | Building sections or templates |
| `docs/05-EDITOR-AND-PREVIEW.md` | The editor, live preview, export and publish | Building the editor |
| `docs/06-ROADMAP.md` | Phases and task checklists | Picking the next task; tick tasks when done |

## The idea in one picture

```
Login -> Questions (8 steps) -> 6 starter ideas -> Editor + live preview -> Publish link / Download HTML
```

## The one rule that makes everything work

A portfolio is **data, not a drawing**. It is saved as one JSON document:

```
portfolio = theme (colors, fonts, style) + ordered list of sections (type, variant, content)
```

Because content and design are separate, the user fills in their data once and can switch the whole design in one click. Canva cannot do this, and it is the heart of the product. Details in `docs/03-ARCHITECTURE.md`.

## Decisions to confirm

These are the defaults the plan assumes. Change them here first if you disagree, then update the matching doc.

1. **Stack:** Next.js + TypeScript + Tailwind, Supabase for login, database and image storage. (Alternative: Laravel or plain Node if you prefer.)
2. **Languages:** portfolios support English and Arabic (right-to-left) from the start. The app interface starts in English, Arabic later.
3. **Pricing:** free to build and publish on our subdomain; paid plan later for HTML download, custom domain, and removing our badge.
4. **AI:** version 1 uses rules, not AI, to suggest ideas. AI text writing ("write my About section") is Phase 6.
5. **Product name:** not chosen. Docs use "Portfolio Maker".
