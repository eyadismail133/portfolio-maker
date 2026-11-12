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
- "Shuffle" button: tries a random good combination. Undo brings the old one back.

**Settings tab**
- Page title, description, share image, favicon.
- Link name (slug).
- Languages and default language.

## Right panel (selected section)

- **Content:** a form built automatically from the section's `fields` list. Field types: text, long text, rich text, image, image list, link, date range, number, level (1 to 5), icon picker, toggle, select, and repeating list (add, remove, reorder items).
- **Layout:** variant picker with thumbnails.
- **Style:** background (default, surface, primary color, image), padding.
- Two-language portfolios show an EN / AR switch at the top of the form.

## Preview

- The preview is an `<iframe>` loading `/preview/[id]`, which runs the same Renderer as the published page. The frame gives true responsive behavior: the phone button really makes the page 390px wide, so CSS breakpoints act correctly.
- The editor sends the document to the frame with `postMessage` on every change; the frame re-renders only what changed. Target: change visible in under 100 ms.
- In the frame, sections show an outline on hover and a small toolbar when selected (move up, move down, duplicate, delete). Clicking a section selects it and scrolls the left list to it; selecting in the list scrolls the preview to it.
- "Preview" button in the top bar opens the page in a new tab without editing outlines.
- Version 2: click any text in the preview to edit it in place.

## State, saving, undo

- One Zustand store holds the document. Every change goes through a named action (`updateContent`, `moveSection`, `setTheme`, ...). No component edits the document directly.
- Undo/redo: keep a history of patches (Immer patches), 100 steps. Typing in one field is grouped into one step.
- Autosave: 1.5 seconds after the last change, save to the database. Show "Saving..." then "Saved". Also keep a copy in the browser so nothing is lost if the connection drops.
- If the same portfolio is open in two tabs, the newest save wins and the other tab shows "Updated elsewhere, reload".
- Keyboard: Ctrl+Z, Ctrl+Shift+Z, Ctrl+S (save now), Delete (remove selected section, with confirm), Ctrl+D (duplicate).

## Images

- Upload by click, drag and drop, or paste. Crop tool with ratios suggested by the section (square for team photos, wide for hero).
- Show a media library of the user's uploaded images to reuse.
- Sample images come from a bundled set of free-license pictures; mark them as samples so the publish check can warn about them.

## Publish menu

- **Publish:** choose link name, run the checklist, go live. Later changes need "Update" to go live.
- **Checklist before publishing** (warnings, not blockers): sample text still present, sample images still present, images missing alt text, empty sections, no contact method, page title not set.
- **Download HTML:** zip file as described in `03-ARCHITECTURE.md`.
- **Share:** copy link, QR code.
- **Unpublish.**

## Done means
- A person who has never seen the editor can change the hero text, swap the design, reorder two sections and publish without help.
- No action loses data on refresh.
- The preview and the published page look the same.
