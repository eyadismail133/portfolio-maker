# 03 - Architecture

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One project for app, API and published pages |
| App interface styling | Tailwind CSS | Fast to build dashboard and editor |
| Portfolio styling | Plain CSS with CSS variables (the render kit) | Exported HTML stays clean and small |
| Login, database, files | Supabase (Auth, Postgres, Storage) | Ready login, row security, image hosting |
| Editor state | Zustand | Simple; undo/redo keeps earlier documents |
| Validation | Zod | One schema for forms, saving, and migrations |
| Drag to reorder | Browser drag and drop, plus move buttons | No extra library needed so far |
| Rich text | Tiptap (bold, italic, link, list only) | |
| Tests | Vitest + Playwright | |
| Hosting | Vercel + Supabase | |

## The three parts

```
1. APP          dashboard, onboarding, editor            src/app, src/components
2. RENDER KIT   turns a portfolio document into a page   src/render-kit
3. RECOMMEND    turns answers into starter documents     src/recommend
```

The render kit is used in four places with the same code: idea cards, editor preview, published page, HTML export. If it looks right in one, it looks right in all.

## Folder structure

```
src/
  app/
    (marketing)/page.tsx
    (auth)/login, signup
    dashboard/
    new/                  onboarding questions and ideas
    editor/[id]/
    preview/[id]/         the page loaded inside the editor's preview frame
    p/[slug]/             published portfolios
    dev/render/           render kit demo with switches (frame/ is the bare page)
    api/                  export, publish, upload, form submissions
  components/             app interface components (Tailwind)
  editor/                 editor store, panels, field components
  render-kit/
    schema/               primitives.ts, document.ts, migrate.ts
    sections/             one folder per section type
      index.ts            list of all sections
      shared.tsx          heading layouts, image placeholder, buttons
      hero/
        index.tsx         schema, sample content, variants, editor fields
        hero.css
    themes/               color.ts, palettes.ts, fonts.ts, families.ts, css-vars.ts
    styles/               base.css, families/<family>.css, index.css (imports everything)
    Renderer.tsx          document in, page out
    registry.ts           section registry and normalizeDoc
    samples.ts            builds sample documents from section sample content
    export.tsx            document in, full HTML file out
    i18n.ts               language helpers, built-in words, safe links
  recommend/              recipes and idea generator
  lib/                    supabase client, upload helper, utils
scripts/render-samples.tsx   writes sample pages to out-samples/
supabase/migrations/      database tables and security rules
docs/
```

Section pieces shared across types: `sections/shared.tsx` (heading layouts, image placeholder, buttons), `sections/entries.tsx` (history rows) and `sections/icons.tsx` (the built-in icon set; a section stores an icon by name, and the editor field type is `icon`).

`samples.ts` builds sample documents of four kinds (`personal`, `company`, `startup`, `everything`) until the Phase 4 idea generator replaces it.

Sections that embed other sites (`video`, `map`) build the frame address themselves from a YouTube or Vimeo link or a place name; a user can never supply a raw frame address.

Variants of a section live together in its `index.tsx`. Split a variant into its own file when the file gets long.

## The portfolio document

Saved as JSON in one database column. This is the most important structure in the project.

```ts
type PortfolioDoc = {
  schemaVersion: number;
  meta: {
    title: string;            // browser tab and SEO
    description: string;
    shareImage?: AssetRef;
    favicon?: AssetRef;
    languages: ("en" | "ar")[];   // first one is the default
  };
  theme: {
    family: string;           // "minimal", "bold", ...
    palette: {                // light mode colors, each a hex value like #1f4fd8
      background: string; surface: string; text: string;
      mutedText: string; primary: string; onPrimary: string;
      accent: string; border: string;
    };
    paletteDark?: Palette;    // dark mode colors; built from the primary color when missing
    mode: "light" | "dark" | "both";   // "both" follows the visitor's device
    fonts: string;            // id of a font pair in themes/fonts.ts
    radius: "none" | "small" | "large" | "pill";
    spacing: "compact" | "normal" | "airy";
    animation: "none" | "subtle" | "lively";
  };
  sections: Section[];        // order in the array = order on the page
};

type Section = {
  id: string;                 // unique, never changes
  type: string;               // "hero", "skills", ...
  variant: string;            // "split", "centered", ...
  hidden: boolean;
  content: unknown;           // shape defined by that section's Zod schema
  style?: {                   // optional per-section overrides
    background?: "default" | "surface" | "primary";   // "image" comes with uploads in Phase 3
    padding?: "small" | "normal" | "large";
  };
};

type LocalizedText = string | { en?: string; ar?: string };
type AssetRef = { assetId: string; url: string; alt: string; width: number; height: number };
```

Rules:
- Content never includes colors or fonts. Theme never includes text. This is what makes one-click design switching possible.
- Switching a section's variant keeps its content, because all variants of a type share one content schema.
- Switching design family changes `theme` and may change variants to that family's preferred ones. Content is untouched.
- Every text field shown to visitors is `LocalizedText`.
- Long text is plain text for now; line breaks become paragraphs. Rich text arrives with the editor and will need a schema migration.
- Saved JSON always goes through `normalizeDoc` before rendering. It migrates old versions, checks the shape, fills defaults, repairs unknown variants, and drops sections it cannot read.

## How a section is defined

Each section registers itself once, and the app builds everything else from that entry:

```ts
registerSection({
  type: "skills",
  name: "Skills",
  category: "profile",
  schema: skillsSchema,            // Zod
  defaults: (ctx) => ({...}),      // sample content, based on field and language
  variants: { bars: SkillsBars, tags: SkillsTags, grid: SkillsGrid },
  fields: [...],                   // tells the editor which form fields to show
});
```

Adding a new section never requires changing the editor.

## How theming works

The Renderer writes the theme as CSS variables in the `style` of the page root (`.pk-root`): light colors as `--pk-l-*`, dark colors as `--pk-d-*`, plus fonts, radius and spacing. `styles/base.css` picks the light or dark set from `data-pk-mode` and hands each section its working colors (`--pk-bg`, `--pk-text`, `--pk-primary`...). A colored section swaps those variables, and everything inside follows.

Section CSS only uses these variables. A design family is a set of token values in `styles/families/<family>.css`, selected with `data-pk-family`, plus its special details.

A family is described in `themes/families.ts`: its default fonts, radius, spacing, mode and palette, and the layout it prefers for each section type. `applyFamily(doc, id)` in `themes/apply.ts` switches a whole portfolio to another family and never touches content.

Family CSS changes tokens first (heading weight and size, card look, tag look, rules) and adds targeted rules only for its signature details. Headings use `--pk-h-tracking` and `--pk-h-leading`, which Arabic pages override, so a family's letter spacing never breaks Arabic text.

Colors are repaired before use: `fixPalette` darkens or lightens any text color that does not reach WCAG AA contrast, so a hand-picked palette cannot produce unreadable text.

All render-kit classes start with `pk-`, and `base.css` carries its own reset, so a page looks the same inside the app (with Tailwind loaded) and as an exported file.

## Database

| Table | Main columns | Purpose |
|---|---|---|
| `profiles` | id (same as auth user), name, avatar_url, plan | Account data |
| `portfolios` | id, user_id, title, slug (unique), doc (jsonb), published_doc (jsonb), status (draft/published), thumbnail_url, updated_at | The portfolios. `doc` is the working copy, `published_doc` is what visitors see |
| `assets` | id, user_id, portfolio_id, path, width, height, size | Uploaded images |
| `onboarding_answers` | id, user_id, portfolio_id, answers (jsonb) | To improve recommendations later |
| `form_submissions` | id, portfolio_id, name, email, message, created_at | Contact form inbox (version 2) |
| `page_views` | portfolio_id, day, count | Simple statistics (version 2) |

Security: row level security on every table. A user can read and write only their own rows. Anyone can read `published_doc` of a published portfolio, through a server route only.

Keeping `doc` and `published_doc` separate means editing never changes the live page until the user clicks Publish again.

## Accounts and saving (as built)

- Pages talk to Supabase from the browser (`src/lib/portfolios.ts`, `src/lib/upload.ts`); row level security in the database is what protects the data. The only server code is `src/proxy.ts`, which refreshes the session and guards private pages, and `/auth/callback`, which finishes Google sign-in and email links.
- Private pages are `/dashboard` and `/editor/[id]`. `/editor` without an id stays open: it edits a draft kept in the browser.
- A save sends the document only if the server still has the version this tab loaded (`updated_at` is compared). If not, the editor stops saving and offers to reload, so two tabs cannot overwrite each other.
- Every change is first copied to the browser (`src/lib/local-drafts.ts`). If the tab closes or the connection drops before the save, the copy is used on the next visit, as long as the server version has not moved on.
- A portfolio chosen before logging in waits in the browser and is saved to the account when the dashboard opens.

## Starter ideas (as built)

`src/recommend/` turns onboarding answers into documents with no AI: `recipes.ts` picks the sections from who the page is for and its goal, then adjusts them to the material the person has ready; `generate.ts` picks design looks from the chosen styles, colors and mode, and builds six documents, five in the chosen styles and one surprise; `content.ts` holds sample text for ten fields. The same answers and seed always give the same six ideas.

## Export and publish
- **Publish:** copy `doc` to `published_doc`, set the slug. `/p/[slug]` renders it on the server with caching.
- **Download:** the server renders the document to static HTML, collects only the CSS for the sections and family in use, downloads the images, and returns a zip: `index.html`, `styles.css`, `images/`, and a tiny optional `script.js` (mobile menu, animations, language switch). The zip must open correctly by double-clicking `index.html` with no internet, except for web fonts.

## Security and limits
- Escape all user text. Sanitize rich text to an allowed list of tags.
- Uploads: images only, 5 MB max, resized to 2000px max, converted to WebP.
- No custom scripts from users. Embeds only from an allowed list (YouTube, Vimeo, Google Maps, Calendly).
- Reserved slugs list (admin, api, login, ...). Rate limit on publish, upload, and contact form.
