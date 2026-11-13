# 05 - Editor and preview

Route: `/editor/[id]`. This is where users spend their time, so it must feel instant.

## Layout

```
+----------------------------------------------------------------------------+
| <- Back   Portfolio name   [Undo][Redo]   Saved    [Desktop|Tablet|Phone]   |
|                                                    [Preview] [Publish v]    |
+--------------+------------------------------------------+------------------+
| LEFT         |                                          | RIGHT            |
| Tabs:        |              LIVE PREVIEW                | Edit selected    |
| - Sections   |          (the real page, in a frame)     | section:         |
| - Design     |                                          | - Content        |
| - Settings   |    click a section to select it          | - Layout         |
|              |                                          | - Style          |
+--------------+------------------------------------------+------------------+
```

On phones the editor shows the preview full screen with a bottom bar that opens the panels as sheets.

## Left panel

**Sections tab**
- List of sections in page order. Drag to reorder. Each row: eye icon (hide/show), duplicate, delete, and click to select.
- "Add section" opens the library grouped by category, with a small preview of each variant. New sections come with sample content.
- Navbar and footer are pinned to top and bottom.

**Design tab**
- Design family: cards with mini previews. One click switches the whole page.
- Colors: ready palettes, brand color picker, light/dark, advanced per-color editing.
- Fonts: font pairs.
- Shape and spacing: corner radius, spacing density, animation level.
- "Shuffle the look" button: random colors, fonts, corners, page touches and some layouts in one step. Undo brings the old one back.
- Fonts (heading and text separately), text size, heading size, weight and letters; Shapes and decoration (photo shape, buttons, section headings, background pattern). See "Page personality" in `04-SECTIONS-AND-DESIGNS.md`.

**Settings tab**
- Page title, description, share image, favicon.
- Link name (slug).
- Languages and default language.

## Right panel (selected section)

- **Content:** a form built automatically from the section's `fields` list. Field types: text, long text, rich text, image, image list, link, date range, number, level (1 to 5), icon picker, toggle, select, and repeating list (add, remove, reorder items).
- **Layout:** variant picker with thumbnails.
- **Style:** background, shape, layout, space and motion (see "Section style" below).
- Two-language portfolios show an EN / AR switch at the top of the form.

## Preview

- The preview is an `<iframe>` loading `/preview/[id]`, which runs the same Renderer as the published page. The frame gives true responsive behavior: the phone button really makes the page 390px wide, so CSS breakpoints act correctly.
- The editor sends the document to the frame with `postMessage` on every change; the frame re-renders only what changed. Target: change visible in under 100 ms.
- In the frame, sections show an outline on hover and a small toolbar when selected (move up, move down, duplicate, delete). Clicking a section selects it and scrolls the left list to it; selecting in the list scrolls the preview to it.
- "Preview" button in the top bar opens the page in a new tab without editing outlines.
- Double-click any plain text in the preview to edit it in place (Enter or clicking away saves, Escape cancels). The frame sends `pk:edit` with the element's original and new text; the editor finds the one field holding that text in the selected section and changes it through `setTextAt`, so it is one undo step. Text with rich-text marks, or text that appears twice, sends `pk:note` and is edited in the form instead.

## State, saving, undo

- One Zustand store (`src/editor/store.ts`) holds the document. Every change goes through a named action (`updateContent`, `moveSection`, `setTheme`, ...). No component edits the document directly.
- The actions call pure functions in `src/editor/doc-ops.ts`, which return a new document and are easy to test.
- Every content change is checked against the section's schema before it is accepted. The schema also fills in missing values, so a new list item starts complete, and a bad edit can never reach the page.
- Undo/redo keeps the last 100 documents. Documents share everything that did not change, so this is cheap. Typing in one field is grouped into one step.
- Text is stored per language only when the portfolio has two languages. The form asks the schema whether a text field keeps one value per language, so plain fields such as an email stay plain.
- Until accounts exist (Phase 3), the draft is saved in the browser 0.6 seconds after the last change, with a "Saving…" then "Saved in this browser" status.
- Later: autosave to the database with an offline copy, and "Updated elsewhere, reload" when the same portfolio is open in two tabs.
- Keyboard: Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y today. Ctrl+S, Delete and Ctrl+D are still to do.

## Added on 13 November 2026
- **Toolbar in the preview:** the selected section shows move up, move down, duplicate and delete at its top corner. After a move or copy the preview scrolls to keep it in view.
- **Shortcuts:** Delete removes the selected section (with an "Undo" hint), Ctrl+D duplicates it, Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y and Ctrl+S as before. They also work while the preview has focus: the frame forwards them with a `pk:key` message.
- **Pickers with pictures:** design family cards show the person's own page in that design; the Layout tab shows the section in each layout.
- **Colors one by one:** "Edit each color" in the Design tab, for light and dark colors, with a warning when text would be hard to read.
- **Settings:** share picture and browser-tab icon.
- **My images:** every image field can reuse an image uploaded before.
- **Phones:** below 1024 px wide the left panel slides in from a button, and the section form opens as a bottom sheet. A bottom bar keeps Sections, Design, More (Download HTML, Fill from CV, PDF CV) and Publish in reach; the header keeps only the name, undo and redo, and the save status.

## Added after the test report (docs/09)
- **Animation** in the Design tab: None, Subtle or Lively, stored in `theme.animation`.
- **Names for screen readers** on the design family and layout buttons ("Minimal design", "Split layout").
- **Contact warning:** a Contact section whose layout has no form shows a note and a button to switch to the form layout.
- **Browser tab** shows the portfolio name.
- **Publishing on Free:** when the account already has its one live page, the dialog says so at the top, names that page, and the main button becomes "Replace my live page" (one database step). After publishing: share buttons for WhatsApp, LinkedIn and X.
- **Dashboard:** a "Getting started" checklist (replace the sample text, add a photo or logo, publish, get a first visit) that ticks itself and can be hidden; each card has Edit plus a "…" menu; on phones the header folds into a menu.

## Section style (Style tab)
Stored in `section.style`. Every field past `background` and `padding` is optional, so saved portfolios need no migration and `schemaVersion` stays 1. Missing means "as the design does it".

| Group | Choices |
|---|---|
| Background | Design default, Plain page, Soft tint, Main color, Accent, Inverted, My color (`color`), Gradient (`color`, `color2`, direction down / diagonal / glow), Picture (`image`, layer dark / darker / light / lighter) |
| Shape | Top and bottom edge: straight, wave, slant, curve, zigzag |
| Layout | Content width (narrow, normal, wide, full), heading position (design, start, centered), heading size (small to huge), cards (design, flat, outline, shadow, glass) |
| Space and motion | Space above and below (none, small, normal, large, extra), entrance when scrolled to (page setting, none, fade, rise, zoom, slide) |

- "Use this style on all sections" copies the style to every section except the navbar and footer; "Reset style" removes it. Both are one Undo step. Dragging a color picker is grouped into one step.
- The navbar shows only Background and Space; the footer and divider hide the heading and card choices; the hero has no entrance (it is on screen when the page opens).
- `render-kit/themes/section-style.ts` turns the style into data attributes for `styles/section-style.css` and, for own colors, gradients and pictures, the `--pk-x-*` colors. It picks white or near-black text, whichever reads better, and keeps the main color only where it still stands out (3:1), so no contrast warning is needed.
- "Design default" vs "Plain page": some designs color a section by themselves (Bold: navbar and hero; Corporate: hero and footer; Creative: footer). Their rules only match `data-pk-bg="default"`, so "Plain page" always gives the plain page color.
- Space is a scale: each section type sets `--pk-pad-base` and the choice sets `--pk-pad-scale`, so the navbar, footer, logo strip and stats follow it too.
- Shaped edges cut the section with a CSS mask; what shows through is the page color. The mask would cut an outline too, so the preview draws the selected section's frame as a separate overlay (`.pk-editor-outline`).
- Entrances run in `page-script.ts` on the published page, never in the editor preview. A section's entrance wins over the page's animation setting; reduce-motion visitors see none.

## Code map

| File | What it does |
|---|---|
| `src/editor/Editor.tsx` | Page layout, preview frame messaging, saving, keyboard |
| `src/editor/panels.tsx` | Left panel: Sections, Design, Settings |
| `src/editor/SectionEditor.tsx` | Right panel: Content, Layout, Style of the selected section |
| `src/editor/SectionStylePanel.tsx` | The Style tab: background, shape, layout, space and motion |
| `src/editor/fields.tsx` | One form control per field type; builds forms from a section's `fields` |
| `src/editor/PreviewFrame.tsx` | The page inside the frame (`/preview`); renders what the editor sends, reports clicks |
| `src/editor/store.ts`, `doc-ops.ts` | State and document changes |

The editor and the frame talk with messages: `pk:ready`, `pk:select`, `pk:action` (toolbar) and `pk:key` (shortcuts) from the frame; `pk:state` and `pk:scroll` to it. Both sides ignore messages from any other origin.

## Images

- Upload by click, drag and drop, or paste. Crop tool with ratios suggested by the section (square for team photos, wide for hero).
- Show a media library of the user's uploaded images to reuse.
- Sample images come from a bundled set of free-license pictures; mark them as samples so the publish check can warn about them.

## Publish and download (as built)

- **Publish** (saved portfolios): a dialog with the link name, a live check that it is free, and a checklist of warnings: sample text still present, empty sections, images without a description, no contact method, missing or sample page title, missing translations. Warnings never block publishing.
- After publishing: the link, Copy link, Open the page, share buttons (WhatsApp, LinkedIn, X), a QR code, and Take offline. When the editor has changes visitors do not see, the dialog says so and offers "Update the live page".
- **Download HTML** (also without an account): a zip that works as a plain website.
- **Version history** in the Settings tab: every publish saves a version; people can save one by hand with a name and restore any of the newest 30. Restoring is a normal change, so Undo brings the page back.

## Done means
- A person who has never seen the editor can change the hero text, swap the design, reorder two sections and publish without help.
- No action loses data on refresh.
- The preview and the published page look the same.

## Rich text and cropping
- **Rich text** stays a plain string in the document, so no HTML is ever stored. Long text fields understand `**bold**`, `*italic*`, `[text](https://…)` and lines starting with `- ` as a list. The renderer (`render-kit/rich-text.tsx`) turns these into React elements, so all text is escaped; links go through `safeHref` and external ones get `rel="noopener noreferrer nofollow"`. A small format bar (B, I, Link, List) above each long text field inserts the marks around the selection.
- **Crop:** choosing an image (not a GIF) opens a crop dialog first: Original, Square, 4:5, 4:3, 3:2 or 16:9, zoom 1–3x, drag or arrow keys to move. The cropped image then goes through the normal upload helper (resize, WebP).
