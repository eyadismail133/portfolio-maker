import { z } from "zod";

export const LANGS = ["en", "ar"] as const;
export const langSchema = z.enum(LANGS);
export type Lang = z.infer<typeof langSchema>;

/** Text shown to visitors: one string for every language, or one string per language. */
export const localizedTextSchema = z.union([
  z.string(),
  z.object({ en: z.string().optional(), ar: z.string().optional() }),
]);
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** A text field that is empty when missing. */
export const textSchema = localizedTextSchema.default("");

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a color like #1f4fd8");

export const assetRefSchema = z.object({
  assetId: z.string(),
  url: z.string(),
  alt: z.string().default(""),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type AssetRef = z.infer<typeof assetRefSchema>;

export const linkSchema = z.object({ label: textSchema, href: z.string().default("") });
export type Link = z.infer<typeof linkSchema>;

/** A month such as "2023-04", a year such as "2023", or empty. */
export const monthSchema = z
  .string()
  .regex(/^(\d{4}(-(0[1-9]|1[0-2]))?)?$/, "Use YYYY or YYYY-MM")
  .default("");

/** End of a date range: a month, or "current" for "until now". */
export const endMonthSchema = z.union([z.literal("current"), monthSchema]).default("");
