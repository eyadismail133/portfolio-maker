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
});
export type Theme = z.infer<typeof themeSchema>;

export const sectionStyleSchema = z.object({
  background: z.enum(["default", "surface", "primary"]).default("default"),
  padding: z.enum(["small", "normal", "large"]).default("normal"),
});

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
