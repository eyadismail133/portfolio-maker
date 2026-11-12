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
| `publications` | Articles, papers, talks with links | list | later |

### Work
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `projects` | Projects with image, description, tags, links, filter by category | grid, large alternating rows, masonry, slider | yes |
| `case-study` | One project in depth: challenge, solution, result, images | long form, side by side | yes |
| `gallery` | Images with lightbox | grid, masonry, slider | yes |
| `video` | YouTube, Vimeo or uploaded clip | single, grid | yes |
| `before-after` | Two images with a slider | single | later |

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
| `careers` | Open jobs with apply link | list | later |

### Trust and conversion
| Type | What it shows | Variants | V1 |
|---|---|---|---|
| `testimonials` | Quotes with name, role, photo, rating | cards grid, slider, one large quote | yes |
| `faq` | Questions and answers | accordion, two columns | yes |
| `cta` | Strong line + button | banner, split with image, minimal | yes |
| `newsletter` | Email sign-up or waitlist | inline, card | yes |
| `contact` | Form, email, phone, address, social links | form + info, form only, info cards | yes |
| `map` | Google Map of location | full width, with address card | yes |
| `booking` | Calendly embed to book a call | embed | later |
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

Version 1 ships 6 (`minimal`, `bold`, `elegant`, `tech`, `corporate`, `creative`), the other 6 follow in Phase 6.

## Colors

- 24 ready palettes (each with light and dark versions), tagged by mood: calm, warm, fresh, serious, luxury, vivid.
- **Custom brand color:** the user picks one color; the app builds the full palette from it (background, surface, text, accent, border) and guarantees readable text contrast (WCAG AA, 4.5:1). If a chosen combination fails contrast, fix it automatically and tell the user.
- Advanced: edit each palette color by hand.

## Fonts

- 15 font pairs (heading + body), each tagged with families it suits.
- Every pair must have an Arabic partner. Suggested: Cairo, Tajawal, IBM Plex Sans Arabic, Almarai, Readex Pro, Noto Kufi Arabic, Amiri (for elegant).
- Fonts load from Google Fonts with `font-display: swap`; only the weights in use.

## Quality bar for every section
- Looks finished with the sample content, and still fine with very long or very short text, 1 item or 20 items, and no image.
- Phone, tablet, desktop.
- Left-to-right and right-to-left.
- Keyboard and screen reader friendly: real headings, alt text, visible focus.
- Animation respects the visitor's "reduce motion" setting.
