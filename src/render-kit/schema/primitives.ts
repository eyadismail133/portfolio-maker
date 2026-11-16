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

/**
 * Id of one item in a list, unique inside its section ("i1", "i2"...). Element styles and the
 * editor find an item by it, so it stays the same when items move. Missing ids are filled in by
 * `fillItemIds`, so content written by hand or by older code never needs them.
 */
export const itemIdSchema = z.string().max(40).optional();

/** One item of a list in section content: its own fields plus the item id. */
export function listItem<T extends z.ZodRawShape>(shape: T) {
  return z.object({ id: itemIdSchema, ...shape });
}

/** A link. It carries an item id too, because links are often items of a list (navbar, footer). */
export const linkSchema = listItem({ label: textSchema, href: z.string().default("") });
export type Link = z.infer<typeof linkSchema>;

/** A month such as "2023-04", a year such as "2023", or empty. */
export const monthSchema = z
  .string()
  .regex(/^(\d{4}(-(0[1-9]|1[0-2]))?)?$/, "Use YYYY or YYYY-MM")
  .default("");

/** End of a date range: a month, or "current" for "until now". */
export const endMonthSchema = z.union([z.literal("current"), monthSchema]).default("");
