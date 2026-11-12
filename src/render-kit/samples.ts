import { getSection, normalizeDoc } from "./registry";
import { SCHEMA_VERSION, type PortfolioDoc, type Theme } from "./schema/document";
import type { Lang } from "./schema/primitives";
import "./sections";
import { getFamily } from "./themes/families";
import { getPalette } from "./themes/palettes";

export type SampleOptions = {
  family?: string;
  palette?: string;
  fonts?: string;
  mode?: Theme["mode"];
  languages?: Lang[];
  /** Section types in page order, each with an optional variant: "hero" or "hero:centered". */
  sections?: string[];
  /** Use the second variant of every section, to see the other layouts. */
  alternate?: boolean;
};

export const PERSONAL_RECIPE = [
  "navbar",
  "hero",
  "about",
  "work-experience",
  "projects",
  "skills",
  "education",
  "languages",
  "testimonials",
  "cta",
  "contact",
  "footer",
];

/** Builds a complete document from the sample content of each section. */
export function createSampleDoc(options: SampleOptions = {}): PortfolioDoc {
  const family = getFamily(options.family ?? "minimal");
  const palette = getPalette(options.palette ?? family.defaults.palette);
  const sections = (options.sections ?? PERSONAL_RECIPE).flatMap((entry) => {
    const [type, wanted] = entry.split(":");
    const def = getSection(type);
    if (!def) return [];
    const names = Object.keys(def.variants);
    const fallback = options.alternate
      ? (names.find((n) => n !== def.defaultVariant) ?? def.defaultVariant)
      : (family.preferredVariants[type] ?? def.defaultVariant);
    return [
      {
        id: type,
        type,
        variant: wanted ?? fallback,
        hidden: false,
        content: def.defaults(),
        style: type === "skills" || type === "testimonials" ? { background: "surface" } : undefined,
      },
    ];
  });
  return normalizeDoc({
    schemaVersion: SCHEMA_VERSION,
    meta: {
      title: "Layla Hassan, product designer",
      description: "Portfolio of Layla Hassan, a product designer in Cairo.",
      languages: options.languages ?? ["en", "ar"],
    },
    theme: {
      family: family.id,
      palette: palette.light,
      paletteDark: palette.dark,
      mode: options.mode ?? family.defaults.mode,
      fonts: options.fonts ?? family.defaults.fonts,
      radius: family.defaults.radius,
      spacing: family.defaults.spacing,
      animation: "subtle",
    },
    sections,
  });
}
