"use client";

import { useMemo, useState } from "react";
import { MiniPreview } from "@/components/MiniPreview";
import { getSection } from "@/render-kit/registry";
import type { Section } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import { isLocalizedIn } from "./doc-ops";
import { FormFields, type FormContext } from "./fields";
import { useEditor } from "./store";
import { IconButton, inputClass, Label, PanelHeading, Segmented } from "./ui";

const ONLY_ENGLISH: Lang[] = ["en"];
type Tab = "content" | "layout" | "style";

/** Right panel: edit the content, layout and style of the selected section. */
export function SectionEditor({ section }: { section: Section }) {
  const [tab, setTab] = useState<Tab>("content");
  const lang = useEditor((s) => s.lang);
  const title = useEditor((s) => s.doc?.meta.title ?? "");
  const doc = useEditor((s) => s.doc);
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
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 py-2.5 pe-2.5 ps-4 dark:border-zinc-800">
        <h2 className="truncate text-sm font-bold tracking-tight">{def.name}</h2>
        <IconButton icon="close" label="Close" onClick={() => select(null)} />
      </div>
      <div className="border-b border-zinc-200/80 px-4 py-2.5 dark:border-zinc-800">
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
      <div key={tab} className="pm-step-transition min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "content" && section.type === "contact" && section.variant !== "form" && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            This layout shows your details but no form, so visitors cannot send you messages here.
            <button
              type="button"
              className="ms-1 font-semibold underline"
              onClick={() => setVariant(section.id, "form")}
            >
              Use the layout with a form
            </button>
          </p>
        )}
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
          <div className="grid gap-2.5">
            <PanelHeading>Layout</PanelHeading>
            {Object.entries(def.variants).map(([id, variant]) => (
              <button
                key={id}
                type="button"
                aria-pressed={section.variant === id}
                aria-label={`${variant.name} layout`}
                onClick={() => setVariant(section.id, id)}
                className={`group rounded-xl border p-2.5 text-start text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  section.variant === id
                    ? "border-blue-600 bg-blue-50/80 font-semibold text-blue-950 shadow-xs ring-1 ring-blue-600 dark:bg-blue-950/70 dark:text-blue-100"
                    : "border-zinc-200/80 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
                }`}
              >
                <div className="mb-2 overflow-hidden rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                  <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                    <MiniPreview
                      doc={{ ...doc!, sections: [{ ...section, variant: id, hidden: false }] }}
                      lang={lang}
                      aspect="aspect-[16/9]"
                    />
                  </div>
                </div>
                {variant.name}
              </button>
            ))}
          </div>
        )}
        {tab === "style" && (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
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
            <div className="grid gap-1.5">
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
