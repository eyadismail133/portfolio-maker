"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { getSection } from "@/render-kit/registry";
import {
  SECTION_EDGES,
  type Palette,
  type Section,
  type SectionStyle,
} from "@/render-kit/schema/document";
import { FormFields, type FormContext } from "./fields";
import { useEditor } from "./store";
import { buttonClass, inputClass, Label, PanelHeading, Segmented } from "./ui";

type Background = SectionStyle["background"];

const BACKGROUNDS: { id: Background; name: string }[] = [
  { id: "default", name: "Design default" },
  { id: "page", name: "Plain page" },
  { id: "surface", name: "Soft tint" },
  { id: "primary", name: "Main color" },
  { id: "accent", name: "Accent" },
  { id: "inverted", name: "Inverted" },
  { id: "custom", name: "My color" },
  { id: "gradient", name: "Gradient" },
  { id: "image", name: "Picture" },
];

const EDGE_NAMES: Record<(typeof SECTION_EDGES)[number], string> = {
  none: "Straight",
  wave: "Wave",
  slant: "Slant",
  curve: "Curve",
  zigzag: "Zigzag",
};

const ENTRANCES = [
  ["", "Like the rest of the page"],
  ["none", "No animation"],
  ["fade", "Fade in"],
  ["rise", "Rise up"],
  ["zoom", "Zoom in"],
  ["slide", "Slide in"],
] as const;

/** What a background choice looks like, for its button. */
function swatch(id: Background, style: SectionStyle | undefined, palette: Palette): CSSProperties {
  const a = style?.color ?? palette.primary;
  const b = style?.color2 ?? palette.accent;
  switch (id) {
    case "default":
      return {
        background: `linear-gradient(135deg, ${palette.background} 50%, ${palette.surface} 50%)`,
      };
    case "page":
      return { background: palette.background };
    case "surface":
      return { background: palette.surface };
    case "primary":
      return { background: palette.primary };
    case "accent":
      return { background: palette.accent };
    case "inverted":
      return { background: palette.text };
    case "custom":
      return { background: a };
    case "gradient":
      return { background: `linear-gradient(135deg, ${a}, ${b})` };
    case "image":
      return style?.image
        ? { background: `center / cover url("${encodeURI(style.image.url)}")` }
        : { background: "repeating-conic-gradient(#d4d4d8 0 25%, #f4f4f5 0 50%) 0 0 / 10px 10px" };
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-zinc-200/80 pt-4 first:border-0 first:pt-0 dark:border-zinc-800">
      <PanelHeading>{title}</PanelHeading>
      {children}
    </section>
  );
}

function ColorInput(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        id={props.id}
        type="color"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
      />
      <Label htmlFor={props.id}>{props.label}</Label>
      <span className="ms-auto font-mono text-[11px] text-zinc-500" data-no-translate>
        {props.value}
      </span>
    </div>
  );
}

/** The Style tab of a section: background, shape, width, headings, cards, space and motion. */
export function SectionStylePanel({ section, ctx }: { section: Section; ctx: FormContext }) {
  const palette = useEditor((s) => s.doc?.theme.palette);
  const { setSectionStyle, resetSectionStyle, applyStyleToAll } = useEditor.getState();
  const [copied, setCopied] = useState(false);
  if (!palette) return null;

  const style = section.style;
  const background = style?.background ?? "default";
  const def = getSection(section.type);
  const isNavbar = section.type === "navbar";
  const isDivider = section.type === "divider";
  const framed = Boolean(def?.pinned);
  const set = (next: Partial<SectionStyle>, group?: string) =>
    setSectionStyle(section.id, next, group ? `${section.id}:style:${group}` : undefined);

  return (
    <div className="grid gap-5">
      <Group title="Background">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Background">
          {BACKGROUNDS.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              aria-pressed={background === id}
              onClick={() => set({ background: id })}
              className={`grid gap-1.5 rounded-lg border p-1.5 text-[11px] font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                background === id
                  ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600 dark:bg-blue-950/70 dark:text-blue-100"
                  : "border-zinc-200/80 text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span
                aria-hidden
                className="h-7 rounded-md border border-zinc-950/10 dark:border-white/10"
                style={swatch(id, style, palette)}
              />
              {name}
            </button>
          ))}
        </div>
        {background === "default" && (
          <p className="text-xs text-zinc-500">
            The design decides. Some designs color the hero or the footer on their own.
          </p>
        )}
        {background === "custom" && (
          <ColorInput
            id="style-color"
            label="Background color"
            value={style?.color ?? palette.primary}
            onChange={(color) => set({ color }, "color")}
          />
        )}
        {background === "gradient" && (
          <>
            <ColorInput
              id="style-color"
              label="From"
              value={style?.color ?? palette.primary}
              onChange={(color) => set({ color }, "color")}
            />
            <ColorInput
              id="style-color2"
              label="To"
              value={style?.color2 ?? palette.accent}
              onChange={(color2) => set({ color2 }, "color2")}
            />
            <Segmented
              label="Gradient direction"
              value={style?.gradient ?? "diagonal"}
              onChange={(gradient) => set({ gradient })}
              options={[
                ["down", "Top to bottom"],
                ["diagonal", "Diagonal"],
                ["radial", "Glow"],
              ]}
            />
          </>
        )}
        {background === "image" && (
          <>
            <FormFields
              fields={[{ key: "image", label: "Background picture", type: "image" }]}
              value={{ image: style?.image }}
              path={[]}
              ctx={ctx}
              onChange={(next) =>
                set({ image: (next.image ?? undefined) as SectionStyle["image"] })
              }
            />
            <div className="grid gap-1.5">
              <Label>Layer over the picture</Label>
              <Segmented
                label="Layer over the picture"
                value={style?.overlay ?? "dark"}
                onChange={(overlay) => set({ overlay })}
                options={[
                  ["dark", "Dark"],
                  ["darker", "Darker"],
                  ["light", "Light"],
                  ["lighter", "Lighter"],
                ]}
              />
            </div>
          </>
        )}
        {["custom", "gradient", "image", "accent"].includes(background) && (
          <p className="text-xs text-zinc-500">
            Text color is chosen for you, so it stays easy to read.
          </p>
        )}
      </Group>

      {!isNavbar && (
        <Group title="Shape">
          <div className="grid grid-cols-2 gap-3">
            {(["edgeTop", "edgeBottom"] as const).map((key) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`style-${key}`}>
                  {key === "edgeTop" ? "Top edge" : "Bottom edge"}
                </Label>
                <select
                  id={`style-${key}`}
                  className={inputClass}
                  value={style?.[key] ?? "none"}
                  onChange={(e) =>
                    set({ [key]: e.target.value === "none" ? undefined : e.target.value })
                  }
                >
                  {SECTION_EDGES.map((edge) => (
                    <option key={edge} value={edge}>
                      {EDGE_NAMES[edge]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Shaped edges show best on a colored, gradient or picture background.
          </p>
        </Group>
      )}

      {!isNavbar && (
        <Group title="Layout">
          <div className="grid gap-1.5">
            <Label>Content width</Label>
            <Segmented
              label="Content width"
              value={style?.width ?? "normal"}
              onChange={(width) => set({ width: width === "normal" ? undefined : width })}
              options={[
                ["narrow", "Narrow"],
                ["normal", "Normal"],
                ["wide", "Wide"],
                ["full", "Full"],
              ]}
            />
          </div>
          {!framed && !isDivider && (
            <>
              <div className="grid gap-1.5">
                <Label>Text alignment</Label>
                <Segmented
                  label="Text alignment"
                  value={style?.align ?? "design"}
                  onChange={(align) => set({ align: align === "design" ? undefined : align })}
                  options={[
                    ["design", "Design"],
                    ["start", "Start"],
                    ["center", "Centered"],
                  ]}
                />
                <p className="text-xs text-zinc-500">
                  Start is left in English and right in Arabic.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label>Heading size</Label>
                <Segmented
                  label="Heading size"
                  value={style?.headingSize ?? "normal"}
                  onChange={(size) => set({ headingSize: size === "normal" ? undefined : size })}
                  options={[
                    ["small", "Small"],
                    ["normal", "Normal"],
                    ["large", "Large"],
                    ["huge", "Huge"],
                  ]}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Cards</Label>
                <Segmented
                  label="Cards"
                  value={style?.cards ?? "design"}
                  onChange={(cards) => set({ cards: cards === "design" ? undefined : cards })}
                  options={[
                    ["design", "Design"],
                    ["flat", "Flat"],
                    ["outline", "Outline"],
                    ["shadow", "Shadow"],
                    ["glass", "Glass"],
                  ]}
                />
              </div>
            </>
          )}
        </Group>
      )}

      <Group title="Space and motion">
        {!isDivider && (
          <div className="grid gap-1.5">
            <Label>Space above and below</Label>
            <Segmented
              label="Space above and below"
              value={style?.padding ?? "normal"}
              onChange={(padding) => set({ padding })}
              options={[
                ["none", "None"],
                ["small", "Small"],
                ["normal", "Normal"],
                ["large", "Large"],
                ["xlarge", "Extra"],
              ]}
            />
          </div>
        )}
        {!framed && section.type !== "hero" && (
          <div className="grid gap-1.5">
            <Label htmlFor="style-entrance">When visitors scroll to it</Label>
            <select
              id="style-entrance"
              className={inputClass}
              value={style?.entrance ?? ""}
              onChange={(e) =>
                set({ entrance: (e.target.value || undefined) as SectionStyle["entrance"] })
              }
            >
              {ENTRANCES.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">Plays on the published page.</p>
          </div>
        )}
      </Group>

      <div className="flex flex-wrap gap-2 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
        {!framed && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              applyStyleToAll(section.id);
              setCopied(true);
            }}
          >
            {copied ? "Used on all sections" : "Use this style on all sections"}
          </button>
        )}
        <button
          type="button"
          className={buttonClass}
          disabled={!style}
          onClick={() => resetSectionStyle(section.id)}
        >
          Reset style
        </button>
      </div>
    </div>
  );
}
