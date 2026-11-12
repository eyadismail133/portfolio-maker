"use client";

import { useState } from "react";
import { families } from "@/render-kit/themes/families";
import { fontPairs } from "@/render-kit/themes/fonts";
import { palettes } from "@/render-kit/themes/palettes";

const WIDTHS = { Desktop: "100%", Tablet: "820px", Phone: "390px" } as const;

function Choice<T extends string>(props: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
      {props.label}
      <select
        className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as T)}
      >
        {props.options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Try the render kit: switch language, colors, fonts, layouts and screen size on a sample portfolio. */
export default function RenderDemo() {
  const [lang, setLang] = useState("en");
  const [family, setFamily] = useState(families[0].id);
  const [palette, setPalette] = useState("");
  const [fonts, setFonts] = useState("");
  const [layout, setLayout] = useState("default");
  const [mode, setMode] = useState("");
  const [width, setWidth] = useState<keyof typeof WIDTHS>("Desktop");
  const query = new URLSearchParams({ lang, family, palette, fonts, layout, mode }).toString();

  return (
    <div className="flex h-dvh flex-col bg-zinc-100 dark:bg-zinc-950">
      <div className="flex flex-wrap items-end gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mr-auto self-center text-sm font-semibold">Render kit demo</h1>
        <Choice
          label="Language"
          value={lang}
          onChange={setLang}
          options={[
            ["en", "English"],
            ["ar", "Arabic"],
          ]}
        />
        <Choice
          label="Design"
          value={family}
          onChange={setFamily}
          options={families.map((f) => [f.id, f.name] as const)}
        />
        <Choice
          label="Colors"
          value={palette}
          onChange={setPalette}
          options={[["", "Design default"], ...palettes.map((p) => [p.id, p.name] as const)]}
        />
        <Choice
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
            ["both", "Follow device"],
          ]}
        />
        <Choice
          label="Fonts"
          value={fonts}
          onChange={setFonts}
          options={fontPairs.map((f) => [f.id, f.name] as const)}
        />
        <Choice
          label="Layouts"
          value={layout}
          onChange={setLayout}
          options={[
            ["default", "First variants"],
            ["alt", "Second variants"],
          ]}
        />
        <Choice
          label="Screen"
          value={width}
          onChange={setWidth}
          options={Object.keys(WIDTHS).map((w) => [w as keyof typeof WIDTHS, w] as const)}
        />
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-0 sm:p-4">
        <iframe
          title="Sample portfolio"
          src={`/dev/render/frame?${query}`}
          className="h-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800"
          style={{ width: WIDTHS[width], maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}
