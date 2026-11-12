import type { Palette } from "../schema/document";
import { buildPalette } from "./color";

export type PaletteMood = "calm" | "warm" | "fresh" | "serious" | "luxury" | "vivid";
export type PalettePreset = {
  id: string;
  name: string;
  mood: PaletteMood;
  light: Palette;
  dark: Palette;
};

function preset(
  id: string,
  name: string,
  mood: PaletteMood,
  brand: string,
  light?: Partial<Palette>,
): PalettePreset {
  return {
    id,
    name,
    mood,
    light: { ...buildPalette(brand, "light"), ...light },
    dark: buildPalette(brand, "dark"),
  };
}

/** The 24 ready palettes. Every one is checked for readable contrast by the tests. */
export const palettes: PalettePreset[] = [
  preset("cobalt", "Cobalt", "serious", "#1f4fd8", { background: "#ffffff", surface: "#f3f5f9" }),
  preset("pine", "Pine", "calm", "#1d6b4f"),
  preset("plum", "Plum", "luxury", "#6b2d6f"),
  preset("ember", "Ember", "warm", "#b8401f"),
  preset("teal", "Lagoon", "fresh", "#0b7285"),
  preset("graphite", "Graphite", "serious", "#2b2f36", {
    background: "#ffffff",
    accent: "#b4441a",
  }),
  preset("berry", "Berry", "vivid", "#c2185b"),
  preset("saffron", "Saffron", "warm", "#8a5a00"),
  preset("ocean", "Ocean", "fresh", "#0057b8"),
  preset("sky", "Sky", "fresh", "#0284c7"),
  preset("mint", "Mint", "fresh", "#0f9d7a"),
  preset("sage", "Sage", "calm", "#55735a"),
  preset("mist", "Mist", "calm", "#4f6d7a"),
  preset("sand", "Sand", "calm", "#8a6a3b"),
  preset("rose", "Rose", "warm", "#b83a5e"),
  preset("clay", "Clay", "warm", "#9c5a3c"),
  preset("sunset", "Sunset", "vivid", "#d9480f"),
  preset("violet", "Violet", "vivid", "#6d28d9"),
  preset("magenta", "Magenta", "vivid", "#a21caf"),
  preset("navy", "Navy", "serious", "#1e2a5a"),
  preset("ink", "Ink", "serious", "#111827", { background: "#ffffff", accent: "#2563eb" }),
  preset("wine", "Wine", "luxury", "#7b1e3a"),
  preset("royal", "Royal green", "luxury", "#14532d", { accent: "#a16207" }),
  preset("onyx", "Onyx", "luxury", "#1c1917", { accent: "#a16207" }),
];

export function getPalette(id: string): PalettePreset {
  return palettes.find((p) => p.id === id) ?? palettes[0];
}
