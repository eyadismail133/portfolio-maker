"use client";

import { useMemo, useState } from "react";
import { getSection, type AnySectionDefinition } from "@/render-kit/registry";
import type { Section } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import { setAt, type Path } from "./doc-ops";
import { FormFields, type FormContext } from "./fields";
import { useEditor } from "./store";
import { IconButton, Label, PanelHeading, Segmented, inputClass } from "./ui";

const ONLY_ENGLISH: Lang[] = ["en"];
const localizedCache = new Map<string, boolean>();

/** Finds out from the section's schema whether a text keeps one value per language. */
function isLocalizedIn(def: AnySectionDefinition, content: unknown, path: Path): boolean {
  const key = `${def.type}:${path.map((p) => (typeof p === "number" ? "*" : p)).join(".")}`;
  const known = localizedCache.get(key);
  if (known !== undefined) return known;
  const result = def.schema.safeParse(setAt(content, path, { en: "x", ar: "x" })).success;
  localizedCache.set(key, result);
  return result;
}

type Tab = "content" | "layout" | "style";

/** Right panel: edit the content, layout and style of the selected section. */
export function SectionEditor({ section }: { section: Section }) {
  const [tab, setTab] = useState<Tab>("content");
  const lang = useEditor((s) => s.lang);
  const title = useEditor((s) => s.doc?.meta.title ?? "");
  const languages = useEditor((s) => s.doc?.meta.languages ?? ONLY_ENGLISH);
  const { updateContent, setVariant, setSectionStyle, select } = useEditor.getState();
  const def = getSection(section.type);

  const ctx = useMemo<FormContext | null>(
    () =>
      def
        ? {
            lang,
            languages,
            isLocalized: (path) => isLocalizedIn(def, section.content, path),
            about: `the ${def.name} section of the portfolio "${title}"`,
          }
        : null,
    [def, lang, languages, section.content, title],
  );
  if (!def || !ctx) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 py-2 pe-2 ps-4 dark:border-zinc-800">
        <h2 className="truncate text-sm font-semibold">{def.name}</h2>
        <IconButton icon="close" label="Close" onClick={() => select(null)} />
      </div>
      <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <Segmented
          label="What to edit"
          value={tab}
          onChange={setTab}
          options={[
            ["content", "Content"],
            ["layout", "Layout"],
            ["style", "Style"],
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "content" && (
          <FormFields
            fields={def.fields}
            value={section.content as Record<string, unknown>}
            path={[]}
            ctx={ctx}
            onChange={(next, group) =>
              updateContent(section.id, next, group ? `${section.id}:${group}` : undefined)
            }
          />
        )}
        {tab === "layout" && (
          <div className="grid gap-2">
            <PanelHeading>Layout</PanelHeading>
            {Object.entries(def.variants).map(([id, variant]) => (
              <button
                key={id}
                type="button"
                aria-pressed={section.variant === id}
                onClick={() => setVariant(section.id, id)}
                className={`rounded-md border px-3 py-2.5 text-start text-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  section.variant === id
                    ? "border-blue-600 bg-blue-50 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}
        {tab === "style" && (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="section-bg">Background</Label>
              <select
                id="section-bg"
                className={inputClass}
                value={section.style?.background ?? "default"}
                onChange={(e) =>
                  setSectionStyle(section.id, {
                    background: e.target.value as "default" | "surface" | "primary",
                  })
                }
              >
                <option value="default">Page background</option>
                <option value="surface">Soft tint</option>
                <option value="primary">Main color</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Space above and below</Label>
              <Segmented
                label="Space above and below"
                value={section.style?.padding ?? "normal"}
                onChange={(padding) => setSectionStyle(section.id, { padding })}
                options={[
                  ["small", "Small"],
                  ["normal", "Normal"],
                  ["large", "Large"],
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
