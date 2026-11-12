import type { Theme } from "../schema/document";

export type DesignFamily = {
  id: string;
  name: string;
  feeling: string;
  /** Variant each section type prefers in this family. Missing types keep their own default. */
  preferredVariants: Record<string, string>;
  defaults: Pick<Theme, "fonts" | "radius" | "spacing" | "mode"> & { palette: string };
};

/** Design families. Each one has a CSS file in styles/families/. */
export const families: DesignFamily[] = [
  {
    id: "minimal",
    name: "Minimal",
    feeling: "Calm, lots of white space, one accent color",
    preferredVariants: {},
    defaults: {
      fonts: "grotesk",
      radius: "small",
      spacing: "normal",
      mode: "light",
      palette: "cobalt",
    },
  },
  {
    id: "bold",
    name: "Bold",
    feeling: "Loud and confident, huge headings, strong color blocks",
    preferredVariants: {
      "work-experience": "cards",
      education: "cards",
      projects: "rows",
      testimonials: "single",
      languages: "list",
      footer: "columns",
    },
    defaults: {
      fonts: "poster",
      radius: "none",
      spacing: "normal",
      mode: "light",
      palette: "berry",
    },
  },
  {
    id: "elegant",
    name: "Elegant",
    feeling: "Refined and quiet, serif headings, thin lines",
    preferredVariants: {
      navbar: "centered",
      hero: "centered",
      about: "text",
      "work-experience": "timeline",
      education: "timeline",
      projects: "rows",
      languages: "list",
      testimonials: "single",
      cta: "minimal",
      contact: "cards",
      footer: "columns",
    },
    defaults: { fonts: "couture", radius: "none", spacing: "airy", mode: "light", palette: "plum" },
  },
  {
    id: "tech",
    name: "Tech",
    feeling: "For developers and products, dark first, monospace details",
    preferredVariants: {
      skills: "bars",
      "work-experience": "timeline",
      education: "timeline",
      projects: "grid",
    },
    defaults: {
      fonts: "technical",
      radius: "small",
      spacing: "normal",
      mode: "dark",
      palette: "teal",
    },
  },
  {
    id: "corporate",
    name: "Corporate",
    feeling: "Clear and trustworthy, structured, soft cards",
    preferredVariants: {
      about: "photo",
      "work-experience": "cards",
      education: "cards",
      skills: "bars",
      footer: "columns",
    },
    defaults: {
      fonts: "business",
      radius: "large",
      spacing: "normal",
      mode: "light",
      palette: "cobalt",
    },
  },
  {
    id: "creative",
    name: "Creative",
    feeling: "Artistic and a little unexpected, organic shapes, tinted cards",
    preferredVariants: {
      "work-experience": "cards",
      education: "cards",
      skills: "tags",
      contact: "cards",
    },
    defaults: {
      fonts: "expressive",
      radius: "large",
      spacing: "normal",
      mode: "light",
      palette: "ember",
    },
  },
];

export function getFamily(id: string): DesignFamily {
  return families.find((f) => f.id === id) ?? families[0];
}
