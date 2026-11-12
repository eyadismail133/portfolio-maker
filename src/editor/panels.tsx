"use client";

import { useMemo, useRef, useState } from "react";
import { pickText } from "@/render-kit/i18n";
import { allSections, getSection, type SectionCategory } from "@/render-kit/registry";
import type { PortfolioDoc, Theme } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import { buildPalette } from "@/render-kit/themes/color";
import { families } from "@/render-kit/themes/families";
import { fontPairs } from "@/render-kit/themes/fonts";
import { palettes } from "@/render-kit/themes/palettes";
import { MiniPreview } from "@/components/MiniPreview";
import { applyFamily } from "@/render-kit/themes/apply";
import { contrastProblems } from "@/render-kit/themes/color";
import { canMove } from "./doc-ops";
import { FormFields } from "./fields";
import { sectionName, useEditor } from "./store";
import {
  IconButton,
  Label,
  PanelHeading,
  Segmented,
  UiIcon,
  buttonClass,
  inputClass,
  primaryButtonClass,
} from "./ui";

const CATEGORY_NAMES: Record<SectionCategory, string> = {
  start: "Start of page",
  profile: "Profile",
  work: "Work",
  business: "Business",
  trust: "Trust and contact",
  free: "Free blocks",
};

function AddSectionDialog({ doc }: { doc: PortfolioDoc }) {
  const ref = useRef<HTMLDialogElement>(null);
  const addSection = useEditor((s) => s.addSection);
  const present = new Set(doc.sections.map((s) => s.type));
  return (
    <>
      <button
        type="button"
        className={`${primaryButtonClass} w-full`}
        onClick={() => ref.current?.showModal()}
      >
        <UiIcon name="plus" /> Add section
      </button>
      <dialog
        ref={ref}
        aria-labelledby="add-section-title"
        className="m-auto w-[min(720px,calc(100vw-32px))] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 py-3 pe-3 ps-5 dark:border-zinc-800">
          <h2 id="add-section-title" className="text-base font-semibold">
            Add a section
          </h2>
          <IconButton icon="close" label="Close" onClick={() => ref.current?.close()} />
        </div>
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto p-5">
          {(Object.keys(CATEGORY_NAMES) as SectionCategory[]).map((category) => {
            const items = allSections().filter((s) => s.category === category);
            return (
              <div key={category} className="grid gap-2">
                <PanelHeading>{CATEGORY_NAMES[category]}</PanelHeading>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {items.map((def) => {
                    const taken = !!def.pinned && present.has(def.type);
                    return (
                      <button
                        key={def.type}
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          addSection(def.type);
                          ref.current?.close();
                        }}
                        className="rounded-md border border-zinc-200 px-3 py-2.5 text-start text-sm hover:border-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-blue-950"
                      >
                        <span className="block font-medium">{def.name}</span>
                        <span className="block text-xs text-zinc-500">
                          {taken
                            ? "Already on the page"
                            : `${Object.keys(def.variants).length} layouts`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </dialog>
    </>
  );
}

/** Left panel, first tab: the sections of the page in order. */
export function SectionsPanel({
  doc,
  onPick,
}: {
  doc: PortfolioDoc;
  onPick: (id: string) => void;
}) {
  const selectedId = useEditor((s) => s.selectedId);
  const lang = useEditor((s) => s.lang);
  const { moveSection, moveSectionTo, toggleHidden, duplicateSection, removeSection } =
    useEditor.getState();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <ol className="grid gap-1">
        {doc.sections.map((section) => {
          const def = getSection(section.type);
          const pinned = !!def?.pinned;
          const label = def?.navLabel ? pickText(def.navLabel(section.content), lang) : "";
          const active = selectedId === section.id;
          return (
            <li
              key={section.id}
              draggable={!pinned}
              onDragStart={(e) => {
                setDragId(section.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragId && !pinned && dragId !== section.id) {
                  e.preventDefault();
                  setOverId(section.id);
                }
              }}
              onDragLeave={() => setOverId((id) => (id === section.id ? null : id))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveSectionTo(dragId, section.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`group flex items-center rounded-md border ${
                overId === section.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                  : active
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/60"
                    : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } ${section.hidden ? "opacity-55" : ""}`}
            >
              <span
                className={`flex w-6 shrink-0 justify-center text-zinc-400 ${pinned ? "invisible" : "cursor-grab"}`}
                aria-hidden="true"
              >
                <UiIcon name="grip" size={14} />
              </span>
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onPick(section.id)}
                className="min-w-0 flex-1 rounded py-2 text-start text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span className="block truncate font-medium">{sectionName(section)}</span>
                {label && label !== sectionName(section) && (
                  <bdi className="block truncate text-xs text-zinc-500">{label}</bdi>
                )}
              </button>
              <span
                className={`flex shrink-0 ${active ? "" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100"}`}
              >
                <IconButton
                  icon="up"
                  label="Move up"
                  disabled={!canMove(doc, section.id, -1)}
                  onClick={() => moveSection(section.id, -1)}
                />
                <IconButton
                  icon="down"
                  label="Move down"
                  disabled={!canMove(doc, section.id, 1)}
                  onClick={() => moveSection(section.id, 1)}
                />
                <IconButton
                  icon="copy"
                  label="Duplicate"
                  disabled={pinned}
                  onClick={() => duplicateSection(section.id)}
                />
                <IconButton icon="trash" label="Delete" onClick={() => removeSection(section.id)} />
              </span>
              <IconButton
                icon={section.hidden ? "eyeOff" : "eye"}
                label={section.hidden ? "Show on the page" : "Hide from the page"}
                aria-pressed={section.hidden}
                onClick={() => toggleHidden(section.id)}
              />
            </li>
          );
        })}
      </ol>
      <AddSectionDialog doc={doc} />
      <p className="text-xs text-zinc-500">
        Drag a section to move it. Deleting can be undone with Undo.
      </p>
    </div>
  );
}

function sameColors(a: Theme["palette"], b: Theme["palette"]) {
  return a.primary === b.primary && a.background === b.background && a.accent === b.accent;
}

/** Left panel, second tab: design family, colors, fonts and shape for the whole page. */
export function DesignPanel({ doc }: { doc: PortfolioDoc }) {
  const lang = useEditor((s) => s.lang);
  // Your own page in each design, top part only: navigation and the first two sections.
  const familyPreviews = useMemo(() => {
    const top = { ...doc, sections: doc.sections.filter((s) => !s.hidden).slice(0, 3) };
    return Object.fromEntries(
      families.map((f) => [
        f.id,
        applyFamily(top, f.id, { keepColors: doc.theme.family === f.id }),
      ]),
    );
  }, [doc]);
  const { setTheme, setFamily } = useEditor.getState();
  const theme = doc.theme;

  const shuffle = () => {
    const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
    const palette = pick(palettes);
    setTheme({
      palette: palette.light,
      paletteDark: palette.dark,
      fonts: pick(fontPairs).id,
      radius: pick(["none", "small", "large", "pill"] as const),
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <PanelHeading>Design</PanelHeading>
          <button type="button" className={buttonClass} onClick={shuffle}>
            <UiIcon name="shuffle" size={14} /> Shuffle
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {families.map((family) => (
            <button
              key={family.id}
              type="button"
              aria-pressed={theme.family === family.id}
              onClick={() => setFamily(family.id)}
              className={`rounded-md border p-2 text-start focus-visible:outline-2 focus-visible:outline-blue-600 ${
                theme.family === family.id
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              }`}
            >
              <MiniPreview
                doc={familyPreviews[family.id]}
                lang={lang}
                aspect="aspect-[16/10]"
                className="mb-2 rounded border border-zinc-200 dark:border-zinc-700"
              />
              <span className="block text-sm font-medium">{family.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                {family.feeling}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Choosing a design also sets its colors, fonts and layouts. Your content stays.
        </p>
      </div>

      <div className="grid gap-2">
        <PanelHeading>Colors</PanelHeading>
        <div className="grid grid-cols-6 gap-1.5">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              title={palette.name}
              aria-label={`${palette.name} colors`}
              aria-pressed={sameColors(theme.palette, palette.light)}
              onClick={() => setTheme({ palette: palette.light, paletteDark: palette.dark })}
              className="aspect-square overflow-hidden rounded-full border-2 border-white ring-1 ring-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-pressed:ring-2 aria-pressed:ring-blue-600 dark:border-zinc-900 dark:ring-zinc-700"
              style={{
                background: `linear-gradient(135deg, ${palette.light.primary} 50%, ${palette.light.accent} 50%)`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <input
            id="brand-color"
            type="color"
            value={theme.palette.primary}
            onChange={(e) =>
              setTheme(
                {
                  palette: buildPalette(e.target.value, "light"),
                  paletteDark: buildPalette(e.target.value, "dark"),
                },
                "brand-color",
              )
            }
            className="size-8 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
          />
          <Label htmlFor="brand-color">Use my own brand color</Label>
        </div>
        <Segmented
          label="Light or dark"
          value={theme.mode}
          onChange={(mode) => setTheme({ mode })}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
            ["both", "Visitor's choice"],
          ]}
        />
        <ColorEditor doc={doc} />
      </div>

      <div className="grid gap-1">
        <PanelHeading>Fonts</PanelHeading>
        <select
          aria-label="Fonts"
          className={`${inputClass} mt-1`}
          value={theme.fonts}
          onChange={(e) => setTheme({ fonts: e.target.value })}
        >
          {fontPairs.map((pair) => (
            <option key={pair.id} value={pair.id}>
              {pair.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <PanelHeading>Corners</PanelHeading>
        <Segmented
          label="Corners"
          value={theme.radius}
          onChange={(radius) => setTheme({ radius })}
          options={[
            ["none", "Square"],
            ["small", "Soft"],
            ["large", "Round"],
            ["pill", "Pill"],
          ]}
        />
      </div>

      <div className="grid gap-2">
        <PanelHeading>Spacing</PanelHeading>
        <Segmented
          label="Spacing"
          value={theme.spacing}
          onChange={(spacing) => setTheme({ spacing })}
          options={[
            ["compact", "Compact"],
            ["normal", "Normal"],
            ["airy", "Airy"],
          ]}
        />
      </div>
    </div>
  );
}

const LANGUAGE_NAMES: Record<Lang, string> = { en: "English", ar: "Arabic" };

/** Left panel, third tab: page title, description and languages. */
export function SettingsPanel({ doc }: { doc: PortfolioDoc }) {
  const { setMeta, setLanguages } = useEditor.getState();
  const languages = doc.meta.languages;
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <Label htmlFor="meta-title">Page title</Label>
        <input
          id="meta-title"
          className={inputClass}
          dir="auto"
          value={doc.meta.title}
          onChange={(e) => setMeta({ title: e.target.value }, "meta-title")}
        />
        <p className="text-xs text-zinc-500">Shown in the browser tab and in search results.</p>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="meta-description">Description</Label>
        <textarea
          id="meta-description"
          rows={3}
          dir="auto"
          className={inputClass}
          value={doc.meta.description}
          onChange={(e) => setMeta({ description: e.target.value }, "meta-description")}
        />
        <p className="text-xs text-zinc-500">
          One or two sentences for search results and link previews.
        </p>
      </div>
      <FormFields
        fields={[
          { key: "shareImage", label: "Picture shown when the link is shared", type: "image" },
          { key: "favicon", label: "Small icon in the browser tab", type: "image" },
        ]}
        value={doc.meta as unknown as Record<string, unknown>}
        path={["meta"]}
        ctx={{
          lang: languages[0],
          languages,
          isLocalized: () => false,
          about: "the page settings",
        }}
        onChange={(next) =>
          setMeta({
            shareImage: next.shareImage as PortfolioDoc["meta"]["shareImage"],
            favicon: next.favicon as PortfolioDoc["meta"]["favicon"],
          })
        }
      />
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-xs font-semibold">Languages</legend>
        {(Object.keys(LANGUAGE_NAMES) as Lang[]).map((lang) => (
          <label key={lang} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={languages.includes(lang)}
              disabled={languages.length === 1 && languages[0] === lang}
              onChange={(e) =>
                setLanguages(
                  e.target.checked ? [...languages, lang] : languages.filter((l) => l !== lang),
                )
              }
            />
            {LANGUAGE_NAMES[lang]}
          </label>
        ))}
        {languages.length > 1 && (
          <div className="mt-1 grid gap-1">
            <Label htmlFor="default-language">Visitors see first</Label>
            <select
              id="default-language"
              className={inputClass}
              value={languages[0]}
              onChange={(e) =>
                setLanguages([
                  e.target.value as Lang,
                  ...languages.filter((l) => l !== e.target.value),
                ])
              }
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_NAMES[lang]}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>
    </div>
  );
}

const COLOR_NAMES: [keyof Theme["palette"], string][] = [
  ["background", "Page background"],
  ["surface", "Soft tint"],
  ["text", "Text"],
  ["mutedText", "Quiet text"],
  ["primary", "Main color"],
  ["onPrimary", "Text on main color"],
  ["accent", "Accent"],
  ["border", "Lines"],
];

/** Each color of the palette, editable by hand. Unreadable text colors are fixed on the page. */
function ColorEditor({ doc }: { doc: PortfolioDoc }) {
  const { setTheme } = useEditor.getState();
  const theme = doc.theme;
  const [which, setWhich] = useState<"light" | "dark">(theme.mode === "dark" ? "dark" : "light");
  const palette =
    which === "light"
      ? theme.palette
      : (theme.paletteDark ?? buildPalette(theme.palette.primary, "dark"));
  const problems = contrastProblems(palette);
  const change = (key: keyof Theme["palette"], value: string) =>
    setTheme(
      which === "light"
        ? { palette: { ...palette, [key]: value } }
        : { paletteDark: { ...palette, [key]: value } },
      `color-${which}-${key}`,
    );
  return (
    <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium">Edit each color</summary>
      <div className="grid gap-3 border-t border-zinc-200 p-3 dark:border-zinc-800">
        {theme.mode !== "light" && (
          <Segmented
            label="Which colors"
            value={which}
            onChange={setWhich}
            options={[
              ["light", "Light"],
              ["dark", "Dark"],
            ]}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          {COLOR_NAMES.map(([key, name]) => (
            <label key={key} className="flex items-center gap-2 text-xs">
              <input
                type="color"
                value={palette[key]}
                onChange={(e) => change(key, e.target.value)}
                className="size-7 shrink-0 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
              />
              {name}
            </label>
          ))}
        </div>
        {problems.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Hard to read: {problems.join(", ")}. The page darkens or lightens these text colors so
            everyone can read them.
          </p>
        )}
      </div>
    </details>
  );
}
