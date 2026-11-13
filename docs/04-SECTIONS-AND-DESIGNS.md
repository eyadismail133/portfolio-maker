# 04 - Sections and designs

This is the catalog. A portfolio is rich when it has 8 to 14 sections; recipes in `02-USER-FLOW.md` choose from this list. "V1" = build in version 1.

## Section library

### Start of page
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `navbar` | Logo or name, links to sections, main button, language switch | simple, centered, floating pill, side menu | yes |
| `hero` | Name, title, short intro, buttons, photo or image | split (text + image), centered, full image background, big typography, with video, with sign-up form | yes |
| `logo-strip` | "Trusted by" row of client or employer logos | static row, scrolling | yes |

### Profile (people)
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `about` | Story, photo, quick facts (location, age, email) | text + photo, text only, with facts card | yes |
| `work-experience` | Jobs: role, company, dates, description, achievements | timeline, cards, compact list | yes |
| `education` | Degree, school, dates, grade, notes | timeline, cards, compact list | yes |
| `skills` | Skills in groups, with optional level | bars, tags, icon grid, circles | yes |
| `languages` | Language + level (native, fluent, ...) | dots, bars, simple list | yes |
| `certificates` | Name, issuer, date, link, image | cards, list, badge grid | yes |
| `awards` | Prize, year, organization | list, cards | yes |
| `interests` | Hobbies with icons | icon row, tags | yes |
| `cv-download` | Button to download CV file | banner, inline | yes |
| `publications` | Articles, papers, talks with links | list, cards | added |

### Work
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `projects` | Projects with image, description, tags, links, filter by category | grid, large alternating rows, masonry, slider | yes |
| `case-study` | One project in depth: challenge, solution, result, images | long form, side by side | yes |
| `gallery` | Images with lightbox | grid, masonry, slider | yes |
| `video` | YouTube, Vimeo or uploaded clip | single, grid | yes |
| `before-after` | Two images with a slider (side by side without the page script) | slider, side by side | added |

### Business (company, startup, freelancer)
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `services` | What we offer: icon, title, text, price optional | cards, list with numbers, tabs | yes |
| `features` | Product benefits | icon grid, alternating image rows, big cards | yes |
| `problem-solution` | The problem and how we solve it | two columns, stacked story | yes |
| `how-it-works` | Steps 1, 2, 3 | horizontal steps, vertical steps | yes |
| `stats` | Big numbers that count up (clients, years, revenue) | row, cards, with background | yes |
| `team` | Members with photo, role, social links | grid, slider, list | yes |
| `pricing` | Plans with features and button | cards, table | yes |
| `timeline` | Company history or roadmap | vertical, horizontal | yes |
| `press` | "As seen in" with quotes and logos | logos, quote cards | yes |
| `partners` | Partner or investor logos with names | grid | yes |
| `mission-values` | Mission, vision, values | three cards, large statement | yes |
| `careers` | Open jobs with apply link | list, cards | added |

### Trust and conversion
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `testimonials` | Quotes with name, role, photo, rating | cards grid, slider, one large quote | yes |
| `faq` | Questions and answers | accordion, two columns | yes |
| `cta` | Strong line + button | banner, split with image, minimal | yes |
| `newsletter` | Email sign-up or waitlist | inline, card | yes |
| `contact` | Form, email, phone, address, social links | form + info, form only, info cards | yes |
| `map` | Google Map of location | full width, with address card | yes |
| `booking` | Calendly embed to book a call; any other https booking link becomes a button | calendar in page, button | added |
| `social-links` | Social profiles | icon row, cards | yes |

### Free blocks
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `text` | Heading + rich text | centered, left | yes |
| `image-text` | Image beside text | image left, image right | yes |
| `quote` | One large quote | simple | yes |
| `divider` | Space or decorative line | line, wave, space | yes |
| `footer` | Name, links, social, copyright | simple, columns, big name | yes |

Total: 43 types, 39 in version 1. Build order is in the roadmap; the first 12 are enough for a personal portfolio.

### Layouts added later (108 in all)
| Type | New layouts |
|---|---|
| `navbar` | floating bar, name and menu button |
| `hero` | photo behind the text (`cover`: a dark layer keeps text white; without a photo it falls back to the palette colors), big name (`statement`) |
| `about` | wide photo and facts card (`banner`) |
| `work-experience`, `education` | compact list |
| `skills` | group cards, level dots |
| `projects` | mixed heights (`masonry`), side-scrolling row (`slider`), text list (`index`) |
| `gallery`, `team` | side-scrolling row |
| `testimonials` | side-scrolling row, wall of quotes |
| `certificates` | badges |
| `stats` | big numbers |
| `features` | big numbered cards |
| `cta` | centered card, big statement |
| `footer` | big name |

Side-scrolling rows use the shared `.pk-slider` class: CSS scroll snapping, no script, so they work in exported HTML. It is positioned and has `min-width: 0`; without that it widens the page on phones.

## Content fields example

Every section doc entry follows this pattern. Example for `work-experience`:

```
heading        text
subheading     text, optional
items[]        role, company, companyUrl, location,
               startDate, endDate (or "current"),
               description (rich text), achievements[] (text), logo (image)
```

Common rules: every section has `heading` and optional `subheading`; lists can be reordered; dates are stored as year-month and formatted per language.

## Design families

A family sets the feeling of the whole page: shapes, spacing, type scale, decoration, animation style. Each one must style every section.

| Family | Feeling | Key details | Good for |
|---|---|---|---|
| `minimal` | Calm, lots of white space | Thin lines, small radius, one accent color | Anyone, safe default |
| `bold` | Loud, confident | Huge headings, strong color blocks | Creatives, startups |
| `elegant` | Luxury, refined | Serif headings, thin borders, soft colors | Consultants, architects, photographers |
| `tech` | Developer, product | Dark first, mono font details, grid lines, glow | Developers, SaaS startups |
| `corporate` | Trustworthy, clear | Structured grid, blue tones, medium radius | Companies, finance, medicine |
| `creative` | Artistic, unexpected | Uneven layouts, overlapping images, shapes | Designers, artists |
| `playful` | Friendly, fun | Rounded pills, bright colors, bouncy motion | Students, kids brands, food |
| `editorial` | Magazine | Big serif titles, columns, numbers on sections | Writers, journalists, agencies |
| `brutalist` | Raw, trendy | Thick black borders, hard shadows, flat colors | Designers, bold startups |
| `glass` | Modern, soft depth | Blurred translucent cards, gradients | Tech, product, personal |
| `gradient` | Energetic, startup | Mesh gradients, soft glow, large radius | Startups, apps |
| `classic-cv` | Like a printed CV | Sidebar with photo, compact, formal | Job seekers, academics |

Version 1 shipped 6 (`minimal`, `bold`, `elegant`, `tech`, `corporate`, `creative`); the other 6 were added in Phase 6. `classic-cv` keeps the normal page flow (no fixed sidebar, so it still works at 360px and in the HTML export): its "sidebar" is the narrow heading column of each section, with a round photo in the hero and a compact print size. The onboarding styles now map to them: bold → brutalist, playful → playful, tech → glass, editorial → editorial, corporate → classic CV, creative → gradient, each as the second look of that style.

## Colors

- 24 ready palettes (each with light and dark versions), tagged by mood: calm, warm, fresh, serious, luxury, vivid.
- **Custom brand color:** the user picks one color; the app builds the full palette from it (background, surface, text, accent, border) and guarantees readable text contrast (WCAG AA, 4.5:1). If a chosen combination fails contrast, fix it automatically and tell the user.
- Advanced: edit each palette color by hand.

## Fonts

- 15 font pairs (heading + body), each tagged with families it suits.
- Every pair must have an Arabic partner. Suggested: Cairo, Tajawal, IBM Plex Sans Arabic, Almarai, Readex Pro, Noto Kufi Arabic, Amiri (for elegant).
- Fonts load from Google Fonts with `font-display: swap`; only the weights in use.

## Page personality
Optional theme choices on top of a family, so two people with the same family still get different pages. Missing means "as the family does it"; switching family clears them (`PERSONAL_THEME_KEYS`), so the new family shows fully.

| Choice | Values | How |
|---|---|---|
| Heading font, text font | any pair's heading or body font | `theme.headingFont` / `bodyFont` hold a pair id; that pair's Arabic partner comes along |
| Text size | small, large | `font-size` on `<html>` (94% / 110%), because section text is sized in rem; the preview sets it on its own `<html>` |
| Heading size, weight, letters | small / large; lightest / boldest loaded weight; capitals (never for Arabic) | CSS variables on `.pk-root` and `data-pk-hcase` |
| Photo shape | square, rounded, circle, arch, blob, tilted | `data-pk-shape`; hero, about and image-beside-text photos |
| Buttons | solid, outline, soft, underline | `data-pk-buttons` |
| Section headings | plain, underline, marker, numbered, line | `data-pk-deco`; any value first removes the family's own heading decoration |
| Background pattern | dots, grid, lines, glow, grain | `data-pk-pattern`; only on sections with the page color |

The CSS is `styles/personality.css`, after the families so the choice wins.

**Starting points:** each of the 16 onboarding looks (`recommend/generate.ts`) has its own touches and signature layouts, and ideas 3 to 6 of a batch get a few random ones (`themes/variety.ts`), so no two ideas in a batch look the same (a test checks this). Shuffle in the Design tab picks colors, fonts, corners, touches and some layouts in one Undo step. Only sections whose layouts all take the same content are varied; contact and about are left alone.

## Settings a design must respect
A design family sets defaults, never fixed values, for anything the person can change: corners come from `--pk-radius` and `--pk-radius-control` (a square family sets `radius: "none"` as its default instead of `border-radius: 0`), section colors only through rules on `data-pk-bg="default"`, and section space through `--pk-pad-base`. That way the Corners setting and every choice in a section's Style tab work in all 12 designs. The per-section style choices are listed in `05-EDITOR-AND-PREVIEW.md`.

## Quality bar for every section
- Looks finished with the sample content, and still fine with very long or very short text, 1 item or 20 items, and no image.
- Phone, tablet, desktop.
- Left-to-right and right-to-left.
- Keyboard and screen reader friendly: real headings, alt text, visible focus.
- Animation respects the visitor's "reduce motion" setting.

## Light and dark for visitors
A page set to "both" follows the visitor's system setting. The page script adds a switch to the navbar (or a small floating button when there is no navbar); the choice is kept in the visitor's browser for that page and sets `data-pk-scheme` on `.pk-root`, which wins over the system setting. Without the script the page still follows the system.

## Newsletter sign-ups
When the newsletter section has no mailing list address, a published page sends sign-ups to `/api/contact?slug=…&kind=signup`, which stores them in `newsletter_signups` (migration 0006, one row per address and page, 30 an hour at most). The owner sees them under Messages and sign-ups and can download them as CSV. There is no plan limit on sign-ups. An exported HTML page has no inbox, so there the form only works with an address of the owner's own.
