# 02 - User flow and screens

## The journey

```
Home page -> Sign up / Log in -> Onboarding questions -> Starter ideas -> Editor -> Publish / Download
                                        ^                                    |
                                        +---- Dashboard (my portfolios) <----+
```

A returning user lands on the Dashboard. "New portfolio" starts the onboarding questions again.

## Screens

| Route | Screen | Notes |
|---|---|---|
| `/` | Marketing home page | Shows example portfolios, "Start free" button |
| `/login`, `/signup` | Login | Email + password, Google. Password reset |
| `/new` | Onboarding questions | One question per step, progress bar, back button |
| `/new/ideas` | Starter ideas | 6 cards with real previews |
| `/dashboard` | My portfolios | Cards with thumbnail, status, actions |
| `/editor/[id]` | Editor | See `05-EDITOR-AND-PREVIEW.md` |
| `/p/[slug]` | Published portfolio | Public, no login |
| `/settings` | Account | Name, email, plan, delete account |

Let people try before signing up if possible: allow the questions and ideas without an account, and ask for login when they click "Use this idea". Answers are kept in the browser until then. (Nice to have, not required for the first build.)

## Onboarding questions

One question per screen, large clickable cards, never more than 8 steps. Every question can be skipped. Answers are saved to `onboarding_answers`.

| # | Question | Answer type | What it controls |
|---|---|---|---|
| 1 | Who is this portfolio for? | One card: Me (professional) / Student / Freelancer / Creative (design, photo, video) / Company / Agency / Startup / Other | Which sections are included |
| 2 | What is your field? | Search list: software, design, marketing, medicine, engineering, architecture, photography, education, finance, food, ... | Sample text, icons, sample images |
| 3 | What is the main goal? | One card: Get hired / Get clients / Attract investors / Get sign-ups / Show my work | Section order and the main button text |
| 4 | Which style feels like you? | Pick up to 2 visual cards: Minimal / Bold / Elegant / Playful / Tech / Editorial / Corporate / Creative | Design families offered |
| 5 | Colors? | Ready palettes, or "I have a brand color" (color picker), plus Light / Dark / Both | Palette |
| 6 | What do you have ready? | Many: photos of me or team, project images, logo, testimonials, CV, video, client logos, numbers to show | Sections with images vs text-first sections |
| 7 | Which language? | English / Arabic / Both | Direction, fonts, language switch |
| 8 | Basics | Name (or company name), one-line title, optional photo or logo | Fills the hero so ideas look real |

## How ideas are generated (rules, no AI needed)

Input: the answers. Output: 6 complete portfolio documents.

1. **Pick the section recipe** from question 1 + 3. Example recipes:
   - Me + Get hired: hero, about, experience, education, skills, languages, projects, certificates, testimonials, contact.
   - Freelancer + Get clients: hero, services, selected work, process, testimonials, pricing, FAQ, contact.
   - Company: hero, client logos, about, services, numbers, case studies, team, testimonials, map and contact.
   - Startup + Investors: hero, problem, solution, features, traction numbers, timeline, team, press, call to action.
   - Startup + Sign-ups: hero with waitlist, features, how it works, screenshots, pricing, FAQ, call to action.
2. **Adjust by question 6:** remove sections the user has no material for (no testimonials ready means that section is added but hidden, so they can turn it on later). No photos means text-first hero variants.
3. **Pick 6 design combinations** from question 4 + 5: the 2 chosen styles map to design families; each idea is a different family or a different variant mix, so the 6 ideas look clearly different. Always include one "surprise" idea outside the chosen styles.
4. **Fill with content:** name and title from question 8, sample text and images matched to the field from question 2.
5. Show each idea as a live scaled-down preview (the real renderer, not a picture), with a name like "Clean Minimal" and a "Use this" button. Also offer "Show me 6 more" and "Start from blank".

The recipes live in code in `src/recommend/` as plain data so they are easy to extend.

## Empty and error states to design
- Dashboard with no portfolios: big "Create your first portfolio" card.
- Editor offline: banner "Changes saved on this device, will sync when online".
- Published slug already taken: suggest alternatives.
- Upload too large or wrong type: clear message with the limit.
