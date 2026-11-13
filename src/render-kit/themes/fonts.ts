import type { Lang } from "../schema/primitives";

type FontFace = { family: string; weights: number[]; fallback: string };
export type FontPair = {
  id: string;
  name: string;
  heading: FontFace;
  body: FontFace;
  arabic: FontFace;
};

const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

/** Font pairs. Every pair has an Arabic partner. */
export const fontPairs: FontPair[] = [
  {
    id: "grotesk",
    name: "Bricolage + Instrument",
    heading: { family: "Bricolage Grotesque", weights: [500, 700], fallback: sans },
    body: { family: "Instrument Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "IBM Plex Sans Arabic", weights: [400, 500, 700], fallback: sans },
  },
  {
    id: "friendly",
    name: "Figtree",
    heading: { family: "Figtree", weights: [600, 800], fallback: sans },
    body: { family: "Figtree", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Tajawal", weights: [400, 500, 700], fallback: sans },
  },
  {
    id: "serif",
    name: "Fraunces + Public Sans",
    heading: { family: "Fraunces", weights: [500, 700], fallback: serif },
    body: { family: "Public Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Amiri", weights: [400, 700], fallback: serif },
  },
  {
    id: "geometric",
    name: "Outfit + DM Sans",
    heading: { family: "Outfit", weights: [500, 700], fallback: sans },
    body: { family: "DM Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Cairo", weights: [400, 600, 700], fallback: sans },
  },
  {
    id: "technical",
    name: "Space Grotesk + IBM Plex",
    heading: { family: "Space Grotesk", weights: [500, 700], fallback: sans },
    body: { family: "IBM Plex Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Readex Pro", weights: [400, 500, 700], fallback: sans },
  },
  {
    id: "bookish",
    name: "Newsreader",
    heading: { family: "Newsreader", weights: [500, 700], fallback: serif },
    body: { family: "Newsreader", weights: [400, 500, 600], fallback: serif },
    arabic: { family: "Noto Naskh Arabic", weights: [400, 500, 700], fallback: serif },
  },
  {
    id: "poster",
    name: "Archivo",
    heading: { family: "Archivo", weights: [700, 800], fallback: sans },
    body: { family: "Archivo", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Alexandria", weights: [400, 600, 800], fallback: sans },
  },
  {
    id: "couture",
    name: "Cormorant + Jost",
    heading: { family: "Cormorant Garamond", weights: [400, 500, 600], fallback: serif },
    body: { family: "Jost", weights: [400, 500], fallback: sans },
    arabic: { family: "El Messiri", weights: [400, 500, 700], fallback: serif },
  },
  {
    id: "business",
    name: "Manrope + Source Sans",
    heading: { family: "Manrope", weights: [600, 700], fallback: sans },
    body: { family: "Source Sans 3", weights: [400, 600], fallback: sans },
    arabic: { family: "Almarai", weights: [400, 700, 800], fallback: sans },
  },
  {
    id: "expressive",
    name: "Syne + DM Sans",
    heading: { family: "Syne", weights: [700, 800], fallback: sans },
    body: { family: "DM Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Rubik", weights: [400, 500, 700, 800], fallback: sans },
  },
  {
    id: "classic",
    name: "Playfair + Source Sans",
    heading: { family: "Playfair Display", weights: [500, 700], fallback: serif },
    body: { family: "Source Sans 3", weights: [400, 600], fallback: sans },
    arabic: { family: "Noto Naskh Arabic", weights: [400, 500, 700], fallback: serif },
  },
  {
    id: "modern",
    name: "Sora + Inter",
    heading: { family: "Sora", weights: [600, 700], fallback: sans },
    body: { family: "Inter", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Noto Sans Arabic", weights: [400, 500, 700], fallback: sans },
  },
  {
    id: "soft",
    name: "Nunito",
    heading: { family: "Nunito", weights: [700, 800], fallback: sans },
    body: { family: "Nunito", weights: [400, 600], fallback: sans },
    arabic: { family: "Baloo Bhaijaan 2", weights: [400, 600, 800], fallback: sans },
  },
  {
    id: "caslon",
    name: "Libre Caslon + Work Sans",
    heading: { family: "Libre Caslon Text", weights: [400, 700], fallback: serif },
    body: { family: "Work Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Amiri", weights: [400, 700], fallback: serif },
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    heading: { family: "Plus Jakarta Sans", weights: [600, 800], fallback: sans },
    body: { family: "Plus Jakarta Sans", weights: [400, 500, 600], fallback: sans },
    arabic: { family: "Tajawal", weights: [400, 500, 700, 800], fallback: sans },
  },
];

export function getFontPair(id: string): FontPair {
  return fontPairs.find((p) => p.id === id) ?? fontPairs[0];
}

function stack(face: FontFace, arabic: FontFace, lang: Lang): string {
  const names = lang === "ar" ? [arabic.family, face.family] : [face.family, arabic.family];
  return `${names.map((n) => `'${n}'`).join(", ")}, ${face.fallback}`;
}

/** Which fonts a theme uses. Heading and body can each come from another pair. */
export type FontChoice = string | { fonts: string; headingFont?: string; bodyFont?: string };

function chosen(choice: FontChoice) {
  const main = typeof choice === "string" ? choice : choice.fonts;
  const headingPair = getFontPair(typeof choice === "string" ? main : (choice.headingFont ?? main));
  const bodyPair = getFontPair(typeof choice === "string" ? main : (choice.bodyFont ?? main));
  return { headingPair, bodyPair };
}

export function fontStacks(choice: FontChoice, lang: Lang) {
  const { headingPair, bodyPair } = chosen(choice);
  return {
    heading: stack(headingPair.heading, headingPair.arabic, lang),
    body: stack(bodyPair.body, bodyPair.arabic, lang),
  };
}

/** The lightest and boldest weights the heading font is loaded in. */
export function headingWeights(choice: FontChoice): { light: number; bold: number } {
  const weights = chosen(choice).headingPair.heading.weights;
  return { light: Math.min(...weights), bold: Math.max(...weights) };
}

/** Google Fonts stylesheet address for the chosen fonts, loading only the weights in use. */
export function googleFontsUrl(choice: FontChoice, languages: readonly Lang[]): string {
  const { headingPair, bodyPair } = chosen(choice);
  const faces = new Map<string, Set<number>>();
  const add = (face: FontFace) => {
    const set = faces.get(face.family) ?? new Set<number>();
    face.weights.forEach((w) => set.add(w));
    faces.set(face.family, set);
  };
  add(headingPair.heading);
  add(bodyPair.body);
  if (languages.includes("ar")) {
    add(headingPair.arabic);
    add(bodyPair.arabic);
  }
  const query = [...faces]
    .map(
      ([family, weights]) =>
        `family=${family.replace(/ /g, "+")}:wght@${[...weights].sort((a, b) => a - b).join(";")}`,
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
