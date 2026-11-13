import { z } from "zod";
import { assetRefSchema, hexColorSchema, langSchema } from "./primitives";

/** Bump this and add a migration in migrate.ts whenever the document shape changes. */
export const SCHEMA_VERSION = 1;

export const paletteSchema = z.object({
  background: hexColorSchema,
  surface: hexColorSchema,
  text: hexColorSchema,
  mutedText: hexColorSchema,
  primary: hexColorSchema,
  onPrimary: hexColorSchema,
  accent: hexColorSchema,
  border: hexColorSchema,
});
export type Palette = z.infer<typeof paletteSchema>;

export const themeSchema = z.object({
  family: z.string().default("minimal"),
  /** Colors for light mode. */
  palette: paletteSchema,
  /** Colors for dark mode. Built from `palette` when missing. */
  paletteDark: paletteSchema.optional(),
  mode: z.enum(["light", "dark", "both"]).default("light"),
  /** Id of a font pair from themes/fonts.ts. */
  fonts: z.string().default("grotesk"),
  radius: z.enum(["none", "small", "large", "pill"]).default("small"),
  spacing: z.enum(["compact", "normal", "airy"]).default("normal"),
  animation: z.enum(["none", "subtle", "lively"]).default("subtle"),
  /*
   * Everything below is optional and was added without a schema version bump: missing means
   * "as the design family does it". Switching family clears these, so the family shows fully.
   */
  /** Font pair whose heading font to use instead of the pair in `fonts`. */
  headingFont: z.string().optional(),
  /** Font pair whose body font to use instead of the pair in `fonts`. */
  bodyFont: z.string().optional(),
  textSize: z.enum(["small", "large"]).optional(),
  headingSize: z.enum(["small", "large"]).optional(),
  /** Lightest or boldest weight the heading font offers. */
  headingWeight: z.enum(["light", "bold"]).optional(),
  headingCase: z.enum(["upper"]).optional(),
  /** Shape of the main photos: hero, about and image beside text. */
  imageShape: z.enum(["square", "rounded", "circle", "arch", "blob", "tilted"]).optional(),
  buttons: z.enum(["solid", "outline", "soft", "underline"]).optional(),
  headingDeco: z.enum(["none", "underline", "marker", "number", "line"]).optional(),
  pattern: z.enum(["dots", "grid", "lines", "glow", "noise"]).optional(),
});

/** Theme choices that belong to a family look and are cleared when the family changes. */
export const PERSONAL_THEME_KEYS = [
  "headingFont",
  "bodyFont",
  "textSize",
  "headingSize",
  "headingWeight",
  "headingCase",
  "imageShape",
  "buttons",
  "headingDeco",
  "pattern",
] as const;
export type Theme = z.infer<typeof themeSchema>;

/**
 * Backgrounds a section can have. "default" lets the design family decide (some color the hero
 * or footer); "page" is always the plain page color. "custom", "gradient" and "image" take their
 * colors from the style itself and pick readable text on their own.
 */
export const SECTION_BACKGROUNDS = [
  "default",
  "page",
  "surface",
  "primary",
  "accent",
  "inverted",
  "custom",
  "gradient",
  "image",
] as const;
export const SECTION_EDGES = ["none", "wave", "slant", "curve", "zigzag"] as const;

/**
 * How one section looks. Everything past background and padding is optional and was added
 * without a schema version bump: old documents simply do not have it, and missing means
 * "as the design family does it".
 */
export const sectionStyleSchema = z.object({
  background: z.enum(SECTION_BACKGROUNDS).default("default"),
  padding: z.enum(["none", "small", "normal", "large", "xlarge"]).default("normal"),
  /** Color for "custom", first color for "gradient". */
  color: hexColorSchema.optional(),
  /** Second color for "gradient". */
  color2: hexColorSchema.optional(),
  gradient: z.enum(["down", "diagonal", "radial"]).optional(),
  /** Picture for "image". */
  image: assetRefSchema.optional(),
  /** Layer over the picture so text stays readable. */
  overlay: z.enum(["dark", "darker", "light", "lighter"]).optional(),
  width: z.enum(["narrow", "normal", "wide", "full"]).optional(),
  /** Alignment of the section heading and its subheading. */
  align: z.enum(["start", "center"]).optional(),
  headingSize: z.enum(["small", "normal", "large", "huge"]).optional(),
  cards: z.enum(["flat", "outline", "shadow", "glass"]).optional(),
  edgeTop: z.enum(SECTION_EDGES).optional(),
  edgeBottom: z.enum(SECTION_EDGES).optional(),
  /** How the section appears when scrolled to. Missing: the page's animation setting. */
  entrance: z.enum(["none", "fade", "rise", "zoom", "slide"]).optional(),
});
export type SectionStyle = z.infer<typeof sectionStyleSchema>;

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  variant: z.string().min(1),
  hidden: z.boolean().default(false),
  /** Checked against the schema of the section type by `normalizeDoc`. */
  content: z.unknown(),
  style: sectionStyleSchema.optional(),
});
export type Section = z.infer<typeof sectionSchema>;

export const metaSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  shareImage: assetRefSchema.optional(),
  favicon: assetRefSchema.optional(),
  /** The first language is the default one. */
  languages: z.array(langSchema).min(1).default(["en"]),
});

export const portfolioDocSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  meta: metaSchema,
  theme: themeSchema,
  sections: z.array(sectionSchema),
});
export type PortfolioDoc = z.infer<typeof portfolioDocSchema>;
