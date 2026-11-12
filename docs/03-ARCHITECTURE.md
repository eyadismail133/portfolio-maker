# 03 - Architecture

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One project for app, API and published pages |
| App interface styling | Tailwind CSS | Fast to build dashboard and editor |
| Portfolio styling | Plain CSS with CSS variables (the render kit) | Exported HTML stays clean and small |
| Login, database, files | Supabase (Auth, Postgres, Storage) | Ready login, row security, image hosting |
| Editor state | Zustand + Immer | Simple, good for undo/redo |
| Validation | Zod | One schema for forms, saving, and migrations |
| Drag to reorder | dnd-kit | |
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
    api/                  export, publish, upload, form submissions
  components/             app interface components (Tailwind)
  editor/                 editor store, panels, field components
  render-kit/
    schema/               Zod schemas, types, migrations
    sections/             one folder per section type
      hero/
        index.ts          registry entry: schema, defaults, variants, editor fields
        HeroSplit.tsx
        HeroCentered.tsx
        hero.css
    themes/               design families, palettes, font pairs
    Renderer.tsx          document in, page out
    registry.ts           list of all sections
    export.ts             document in, HTML + CSS + images out
  recommend/              recipes and idea generator
  lib/                    supabase client, upload helper, utils
supabase/migrations/      database tables and security rules
docs/
```

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
    palette: {                // every color the page uses
      background: string; surface: string; text: string;
      mutedText: string; primary: string; onPrimary: string;
      accent: string; border: string;
    };
    mode: "light" | "dark" | "both";
    fonts: { heading: string; body: string };
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
    background?: "default" | "surface" | "primary" | "image";
    backgroundImage?: AssetRef;
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

The renderer writes the theme as CSS variables on the page root:

```css
[data-theme-family="minimal"] { --radius: 4px; --section-gap: 96px; ... }
:root { --color-bg: #fff; --color-primary: #2456d6; --font-heading: "Sora"; ... }
```

Section CSS only uses these variables. A design family is a set of variable values plus a small CSS file for its special details (for example heavy borders for "brutalist").

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

## Export and publish
- **Publish:** copy `doc` to `published_doc`, set the slug. `/p/[slug]` renders it on the server with caching.
- **Download:** the server renders the document to static HTML, collects only the CSS for the sections and family in use, downloads the images, and returns a zip: `index.html`, `styles.css`, `images/`, and a tiny optional `script.js` (mobile menu, animations, language switch). The zip must open correctly by double-clicking `index.html` with no internet, except for web fonts.

## Security and limits
- Escape all user text. Sanitize rich text to an allowed list of tags.
- Uploads: images only, 5 MB max, resized to 2000px max, converted to WebP.
- No custom scripts from users. Embeds only from an allowed list (YouTube, Vimeo, Google Maps, Calendly).
- Reserved slugs list (admin, api, login, ...). Rate limit on publish, upload, and contact form.
