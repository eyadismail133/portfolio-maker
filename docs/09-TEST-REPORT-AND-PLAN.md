# 09 - Test report and improvement plan (13 November 2026)

## How it was tested
- **Live site** (https://portfolio-maker-ten-virid.vercel.app), in a real browser:
  - **Visitor:** every public page and link, 404s, private-page redirects, sitemap and robots, console errors, and the server endpoints with harmless inputs.
  - **Logged in to the owner's account:** dashboard, a separate test portfolio ("QA Test Portfolio (autosave)", not published), a real image upload with crop to Supabase storage, autosave and reload, the Free limits (HTML download, AI, a second published page), inbox and account. The owner's own page "automotive era" was only read, never changed.
- **Production build on the test machine** with a stand-in database, about 70 scripted checks:
  - **Editor:**
    - every header button, the section list buttons and the keyboard shortcuts;
    - all 41 addable section types and all 108 layouts;
    - all 12 designs, 24 palettes, 15 font pairs, modes, corners, spacing and colors;
    - the settings and versions;
    - the photo upload with crop, typing in the form, the format bar and double-click editing in the preview.
  - **Publishing and the published page:** publishing, copy link, QR code, the language switch on the published page, the contact form and the newsletter form.
  - **Account screens:** inbox, dashboard rename, duplicate and delete, the account page and the password change.
  - **Login pages:** wrong password, short password, forgot password, the report form.
  - **Pro features:** HTML download, PDF CV, AI buttons and the domain panel.
  - **Looks:** dark mode, phone width and Arabic.
- **What passed:** everything not listed below. No page crashed anywhere. The live database (all migrations, including 0006) answers correctly, and fake Paymob callbacks are rejected.

## Bugs found

| # | Severity | Where | What happens | Cause |
|---|---|---|---|---|
| B1 | High | Navbar, editor and published page | An uploaded logo is saved (the field shows it, uploads work) but **never appears in the navbar**. The onboarding logo has the same problem. | The navbar's schema has a `logo` field and the form shows it, but the navbar layout never draws it. |
| B2 | High | Published pages | All page content is sent inside a hidden block that JavaScript reveals. **With JavaScript off the page is blank**, so link-preview bots, simple crawlers and the no-JS contact form fallback see nothing. | Partial prerendering streams the page into a Suspense hole. |
| B3 | Medium | Editor, Design | There is **no animation setting** (none / subtle / lively), so no one can choose "lively". | The control was never added to the Design panel. |
| B4 | Medium | Editor, accessibility | The design-family buttons and the layout buttons have no proper names. A screen reader says "Layla Hassan About Email me Menu…" instead of "Minimal". | Their names come from the mini preview inside them. |
| B5 | Medium | Published page menu | Automatic menu links use the full section heading, for example "A factory extension on schedule", so the menu gets long and wraps. | `navLabel` uses the heading. |
| B6 | Medium | Inbox | The owner's page has a Contact section whose layout has no form, so messages can never arrive. The inbox still says "Publish a portfolio with a Contact section". | Nothing checks the contact layout. |
| B7 | Medium | Publish, Free plan | The "1 published page" limit appears only after clicking Publish, at the bottom of a long dialog, with no one-click fix. | The limit is checked only on publish. |
| B8 | Medium | Phone | The dashboard header wraps into two rows. In the editor, Publish is off-screen to the right and needs a sideways scroll. | The headers are built for wide screens. |
| B9 | Low | Contact forms without the inbox (previews, downloaded HTML) | The form sends to a `mailto:` address. Chrome warns "insecure form", and visitors of a downloaded page can get a "not secure" warning when they send. | Uses a form with `action="mailto:"`. |
| B10 | Low | Account | "Images: 0 MB of 50 MB" after uploads, because small files round down to 0. | Shown in whole MB. |
| B11 | Low | Home page | Between about 400 and 640px wide, the design stage blows the phone layout up to 136%, and it doesn't react when the window is resized. | Fixed width; no resize listener. |
| B12 | Low | Production | The internal page `/dev/render` is public. | Not hidden in production. |
| B13 | Low | Editor | The browser tab always says "Portfolio Maker", never the portfolio's name. | No page title. |
| B14 | Low | Dashboard | The card buttons wrap: "Delete" drops alone onto a second line. | Four buttons in a narrow card. |
| B15 | Low | Pricing, dark mode | The selected month's price text has low contrast. | Color mix. |

**Not bugs, but settings missing on live (owner):**
- **Payments:** the Paymob keys aren't set, so checkout answers "setup".
- **Custom domains:** the panel stays hidden until `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are set.
- **Emails and daily job:** need `RESEND_API_KEY`, `EMAIL_FROM` and `CRON_SECRET`.
- **AI:** can't be tested on live without a Pro account.

## Improvements that would most upgrade the experience

1. **Logo everywhere:** logo in the navbar (with a size setting) and the footer, the favicon made from the logo automatically, and a brand color suggested from the logo's colors during onboarding.
2. **Sharing that looks good:**
   - **Share images:** each published page gets its own share image (name, title and colors) when the owner hasn't uploaded one, and the home page gets one too, so links on WhatsApp, LinkedIn and Facebook show a card instead of nothing.
   - **Share buttons:** the publish success screen gets WhatsApp, LinkedIn and X share buttons next to Copy link and the QR code.
3. **Clearer publishing on Free:** the dialog shows the limit before you click, with a "Replace my live page with this one" button that takes the other page offline and publishes this one in a single step.
4. **Animation setting** in Design (None / Subtle / Lively) with a short live demo in the preview.
5. **Phone editing:**
   - **Editor:** a bottom bar with Sections, Preview and Publish always in reach, and a "More" menu for Download, PDF CV and Fill from CV.
   - **Dashboard:** the header collapses into a menu, and each card's actions go into a "…" menu.
6. **Getting-started checklist on the dashboard:** replace the sample text, add a photo or logo, publish, share. It reuses the publish checks and ticks itself.
7. **Contact that always works:**
   - **Editor warning:** a note when the Contact layout has no form.
   - **Inbox:** an empty state that explains why no messages are arriving.
   - **Downloaded pages:** a "Send email" button instead of a mailto form.
8. **Short menu names:** each section gets an optional "Menu name", defaulting to a short word (About, Work, Services) instead of the full heading.
9. **Small polish:** the portfolio name in the editor's browser tab, storage shown in KB and MB, a show-password button on the login pages, "Shuffle" renamed to "Shuffle colors and fonts", and `/dev/render` hidden in production.
10. **Accessibility pass:** names for every icon and preview button, plus an automatic accessibility scan (axe) added to the browser checks so these don't come back.

## The plan: everything in one change set
Each step lists the files and the check that proves it. They are ordered so the riskiest fixes come first.

1. **Logo (B1, improvement 1):**
   - **Navbar:** draw the logo in every layout, image before the name, height set by a new `logoSize` option (small/medium/large). Logo-only is allowed when the name is empty.
   - **Footer:** a new optional logo field, drawn the same way.
   - **Favicon:** made from the logo when none is set.
   - **Schema:** both fields are optional, so `schemaVersion` doesn't change.
   - **Files:** `render-kit/sections/navbar/*`, `footer/*`, `PublishedPage.tsx`, `export.tsx`.
   - **Tests:** a render test that checks the navbar shows the logo in both layouts and both languages.
2. **Published pages without JavaScript (B2):**
   - **Change:** render `/p/[slug]` from the cached published document so the HTML arrives complete, with no hidden block. The proxy already returns real 404s, so the Suspense version is no longer needed.
   - **Tests:** a browser check with JavaScript off for the page content, the contact form and the meta tags.
3. **Animation setting (B3, improvement 4):** None / Subtle / Lively in the Design panel, stored in `theme.animation`.
4. **Accessibility (B4, improvement 10):**
   - **Labels:** add `aria-label` to the family, layout and section buttons.
   - **Scan:** add axe to `npm run visual`.
5. **Menu names (B5, improvement 8):**
   - **Field:** an optional `menuLabel` on every section, used by the navbar's automatic links, defaulting to a short name per section type.
   - **Note:** stored in the section wrapper, not the content, so saved portfolios keep working.
6. **Contact (B6, B9, improvement 7):**
   - **Editor:** a warning when the Contact layout has no form.
   - **Inbox:** an empty state that names the reason.
   - **Downloaded pages:** a mailto button instead of a mailto form.
7. **Publishing on Free (B7, improvements 2 and 3):**
   - **Limit up front:** the limit appears at the top of the dialog when it applies, with a "Replace my live page" button (unpublish the other, then publish, in one database call so it can't half-happen).
   - **Success screen:** share buttons.
   - **Share images:** generated per page with `next/og`, plus one for the home page.
8. **Phone layouts (B8, B14, improvement 5):** the editor's bottom action bar, the dashboard header menu and the card "…" menu.
9. **Getting-started checklist (improvement 6).**
10. **Small fixes (B10–B13, B15, improvement 9).**
11. **Arabic:** translations for every new interface text.
12. **Docs and checks:**
    - **Checks:** lint, typecheck, tests, the visual comparison (update the baseline where layouts intentionally changed) and a full browser run of the scripts used for this report.
    - **Docs and roadmap:** update both, then commit by area.

**Owner steps, unchanged:** the Paymob keys; the optional settings in `docs/07-SUPABASE-SETUP.md` step 9; deleting the test portfolio "QA Test Portfolio (autosave)" (it is a draft and was never published).

## Status after the fixes (13 November 2026)

All 15 bugs and the 10 improvements above are done, with these notes:
- **Done as planned:**
  - **Logo:** navbar (small, medium, large), footer, and the favicon from the logo.
  - **Published pages:** complete HTML from route handlers. They work without JavaScript.
  - **Share images:** made per page.
  - **Animation setting.**
  - **Accessibility names:** on the design and layout buttons.
  - **Short menu names.**
  - **Contact:** the warning (on the Content and Layout tabs), the inbox reasons, and a downloaded form with no `mailto:` action.
  - **Publishing on Free:** "Replace my live page" in one database step (`0007`), and share buttons.
  - **Phones:** the editor's bottom bar, the dashboard header menu, and the card "…" menu.
  - **Getting-started checklist.**
  - **Small fixes:** B10 to B13 and B15.
  - **Arabic:** every new text.
- **Changed from the plan:**
  - **Menu names:** they come from the section type when the heading is long. A separate "Menu name" field per section is not added (no document change was needed).
  - **axe scan:** not added to `npm run visual`. It would need a new dependency, so it's left for a later decision.
- **Checked:**
  - **Automated:** lint, typecheck and 501 tests, including new database checks for `publish_replacing_live`.
  - **Browser (local build):** 19 checks covering publish and replace, share buttons, HTML with JavaScript off, the share image, logo upload and size, animation, names, the tab title, the checklist, the card menu, phone dashboard and editor, the contact warning and Arabic.
  - **Visual baseline:** updated, because shorter menu names make the navbar one row shorter.
- **Pro features on live** (owner's account, on the test portfolio only):
  - **Working:** HTML download (zip built), AI "Shorten", CV import from pasted text (preview only, not applied), version history (30 kept, saved one by hand), PDF CV page, a second published page, no badge, and share buttons.
  - **Custom domain panel:** stays hidden until `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are set.
- **Found while testing Pro and fixed:**
  - **AI prompt:** "Shorten" replaced the real city with "[your city]". The prompt now keeps facts already in the text and uses placeholders only for missing ones.
  - **Share image:** an undefined font style crashed the image route.
- **Owner steps:** run `0007_publish_replacing.sql` in the Supabase SQL editor; it is needed for "Replace my live page" on Free.
