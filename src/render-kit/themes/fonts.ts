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

/** Font pairs. Every pair has an Arabic partner. The full set of 15 is a later Phase 1 task. */
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
];

export function getFontPair(id: string): FontPair {
  return fontPairs.find((p) => p.id === id) ?? fontPairs[0];
}

function stack(face: FontFace, arabic: FontFace, lang: Lang): string {
  const names = lang === "ar" ? [arabic.family, face.family] : [face.family, arabic.family];
  return `${names.map((n) => `'${n}'`).join(", ")}, ${face.fallback}`;
}

export function fontStacks(pairId: string, lang: Lang) {
  const pair = getFontPair(pairId);
  return {
    heading: stack(pair.heading, pair.arabic, lang),
    body: stack(pair.body, pair.arabic, lang),
  };
}

/** Google Fonts stylesheet address for a pair, loading only the weights in use. */
export function googleFontsUrl(pairId: string, languages: readonly Lang[]): string {
  const pair = getFontPair(pairId);
  const faces = new Map<string, Set<number>>();
  const add = (face: FontFace) => {
    const set = faces.get(face.family) ?? new Set<number>();
    face.weights.forEach((w) => set.add(w));
    faces.set(face.family, set);
  };
  add(pair.heading);
  add(pair.body);
  if (languages.includes("ar")) add(pair.arabic);
  const query = [...faces]
    .map(
      ([family, weights]) =>
        `family=${family.replace(/ /g, "+")}:wght@${[...weights].sort((a, b) => a - b).join(";")}`,
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
