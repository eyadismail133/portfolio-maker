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

/** Ready palettes. The full set of 24 is a later Phase 1 task. */
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
];

export function getPalette(id: string): PalettePreset {
  return palettes.find((p) => p.id === id) ?? palettes[0];
}
