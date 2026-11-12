# 06 - Roadmap

Tick tasks as they are finished. Each phase ends with something you can see working. Sizes are rough, for one developer working with AI help.

## Phase 0 - Setup (1 to 2 days)
- [x] Confirm the decisions in `README.md` (defaults accepted on 2026-11-12)
- [x] Create Next.js + TypeScript + Tailwind project, lint, format, test tools
- [x] Supabase client code and `.env.example`
- [x] Folder structure from `03-ARCHITECTURE.md`
- [x] Local git repository with first commit
- [x] Create the Supabase project and fill in `.env.local`
- [x] Session refresh in `src/proxy.ts`
- [x] Push to GitHub (`eyadismail133/portfolio-maker`)
- [ ] First deploy to Vercel (needs the owner's Vercel account)

**Result:** empty app online.

## Phase 1 - Render kit (1.5 to 2 weeks)
The core. No login, no editor yet; work with JSON files.
- [x] Zod schema and types for the portfolio document, with `schemaVersion` and migration helper
- [x] Section registry and `Renderer`
- [x] Theme system: CSS variables, palette builder from one brand color, contrast check
- [x] First design family: `minimal`
- [x] First 12 sections: navbar, hero, about, work-experience, education, skills, languages, projects, testimonials, contact, cta, footer (at least 2 variants each)
- [x] Right-to-left layout and Arabic sample content
- [ ] Check the Arabic web fonts in a real browser (they could not load in the build sandbox)
- [x] Demo page `/dev/render` that shows sample documents, with switches for family, palette, direction, screen size
- [x] Add families: `bold`, `elegant`, `tech`, `corporate`, `creative`
- [x] One-step family switch that keeps content (`themes/apply.ts`)
- [x] Remaining version 1 sections (27 more): all 39 version 1 sections exist, each with at least 2 layouts
- [ ] Section extras that need a small script: gallery lightbox, counting numbers in `stats`, sending the newsletter and contact forms without leaving the page
- [x] 24 palettes and 15 font pairs
- [x] Visual check: `npm run visual` opens every section in every family, both languages, phone and desktop; it fails on sideways scrolling or empty sections and saves screenshots
- [ ] Compare screenshots against saved good ones automatically (today a person looks at them)

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
- [ ] Section toolbar inside the preview (move, duplicate, delete)
- [ ] Small pictures of each layout and each design family in the pickers
- [ ] Editing each palette color by hand
- [ ] Editor layout for phones and small tablets
- [ ] More keyboard shortcuts: Delete, Ctrl+D, Ctrl+S
- [ ] Share image, favicon and link name in Settings (need uploads and publishing)
- [ ] Rich text (bold, italic, links, lists) in long text fields

**Result:** full editing works locally without an account. Open `/editor`.

## Phase 3 - Accounts and saving (1 week)
Can start in parallel with Phase 2.
- [ ] Database tables and row security from `03-ARCHITECTURE.md`
- [ ] Sign up, log in, Google, password reset, protected routes
- [ ] Dashboard: list, create, rename, duplicate, delete
- [ ] Autosave to database with saved indicator and offline copy
- [ ] Image upload: resize, WebP, crop tool, media library

**Result:** users keep their work.

## Phase 4 - Onboarding and ideas (1 week)
- [ ] Question screens (8 steps) with progress, back, skip
- [ ] Recipes for each user type and goal
- [ ] Sample content sets for at least 10 fields, in English and Arabic
- [ ] Idea generator: answers in, 6 documents out
- [ ] Ideas screen with live mini previews, "6 more", "start blank"
- [ ] Save answers

**Result:** the full main idea works: login, questions, ideas, edit.

## Phase 5 - Publish and export (1 week)
- [ ] Publish flow: slug, checklist, `published_doc`
- [ ] Public page `/p/[slug]` with caching, SEO tags, share image
- [ ] HTML zip export, tested offline
- [ ] Auto thumbnail for the dashboard
- [ ] Share: copy link, QR code
- [ ] Marketing home page with example portfolios

**Result:** version 1 complete. Test with 5 to 10 real people before going further.

## Phase 6 - Power features (ongoing, pick by user feedback)
- [ ] 6 more design families
- [ ] Remaining "later" sections
- [ ] Edit text directly in the preview
- [ ] CV / LinkedIn import to fill data
- [ ] AI writing help
- [ ] PDF CV download from the same data
- [ ] Working contact form + inbox
- [ ] Visitor statistics
- [ ] Scroll animations, dark/light switch for visitors
- [ ] Version history
- [ ] App interface in Arabic

## Phase 7 - Launch and business
- [ ] Plans and payment (Stripe, or Paymob for Egypt)
- [ ] Custom domains
- [ ] Remove badge for paid plan
- [ ] Terms, privacy policy, report abuse link on published pages
- [ ] Error monitoring and backups
- [ ] Template gallery page for SEO

## Risks to watch
| Risk | How we handle it |
|---|---|
| Sections x families x variants is a lot of design work | Families are mostly variable values; screenshot tests catch breakage; ship 6 families first |
| Exported HTML differs from preview | Same Renderer everywhere; export is tested in Phase 5 |
| Document shape changes break old portfolios | `schemaVersion` + migrations from day one |
| Scope grows before launch | Phase 6 stays closed until Phase 5 is tested with real users |
