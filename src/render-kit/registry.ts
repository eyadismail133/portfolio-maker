import type { ReactElement } from "react";
import type { z } from "zod";
import type { UiKey } from "./i18n";
import { migrateDoc } from "./schema/migrate";
import { portfolioDocSchema, type PortfolioDoc } from "./schema/document";
import type { Lang, LocalizedText } from "./schema/primitives";

/** What every section component gets besides its own content. */
export type SectionContext = {
  lang: Lang;
  dir: "ltr" | "rtl";
  /** Text in the page language. */
  t: (value: LocalizedText | undefined) => string;
  /** Built-in words such as "Present". */
  ui: (key: UiKey) => string;
  /** Visible sections a navbar can link to. */
  nav: { id: string; label: string }[];
  /** Languages of the portfolio, default first. */
  languages: Lang[];
};

export type SectionProps<C> = { content: C; ctx: SectionContext };
export type VariantComponent<C> = (props: SectionProps<C>) => ReactElement | null;

/** Tells the editor which form field to show for a piece of content. */
export type FieldDef = {
  /** Name of the content value. A dot reaches into a nested object: "problem.title". */
  key: string;
  label: string;
  type:
    | "text"
    | "longtext"
    | "image"
    | "url"
    | "link"
    | "month"
    | "end-month"
    | "level"
    | "icon"
    | "toggle"
    | "select"
    | "text-list"
    | "list";
  options?: readonly string[];
  /** Fields of one item, for type "list". */
  fields?: FieldDef[];
};

export type SectionCategory = "start" | "profile" | "work" | "business" | "trust" | "free";

export type SectionDefinition<S extends z.ZodType> = {
  type: string;
  name: string;
  category: SectionCategory;
  schema: S;
  /** Sample content for a new section. */
  defaults: () => z.input<S>;
  variants: Record<string, { name: string; component: VariantComponent<z.output<S>> }>;
  defaultVariant: string;
  fields: FieldDef[];
  /** Label for navbar links. Sections without one are not linked. */
  navLabel?: (content: z.output<S>) => LocalizedText | undefined;
  /** Navbar and footer stay pinned to the top and bottom of the page. */
  pinned?: "top" | "bottom";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;

export function defineSection<S extends z.ZodType>(
  def: SectionDefinition<S>,
): SectionDefinition<S> {
  if (!def.variants[def.defaultVariant]) {
    throw new Error(`Section "${def.type}" has no variant "${def.defaultVariant}"`);
  }
  return def;
}

const registry = new Map<string, AnySectionDefinition>();

export function registerSections(defs: AnySectionDefinition[]) {
  for (const def of defs) registry.set(def.type, def);
}

export function getSection(type: string): AnySectionDefinition | undefined {
  return registry.get(type);
}

export function allSections(): AnySectionDefinition[] {
  return [...registry.values()];
}

/**
 * Turns saved JSON into a document that is safe to render: migrates old versions, checks the
 * shape, fills in missing values, and drops sections whose type or content is not valid.
 */
export function normalizeDoc(raw: unknown): PortfolioDoc {
  const doc = portfolioDocSchema.parse(migrateDoc(raw));
  const sections = doc.sections.flatMap((section) => {
    const def = getSection(section.type);
    if (!def) return [];
    const content = def.schema.safeParse(section.content ?? {});
    if (!content.success) return [];
    const variant = def.variants[section.variant] ? section.variant : def.defaultVariant;
    return [{ ...section, variant, content: content.data }];
  });
  return { ...doc, sections };
}
