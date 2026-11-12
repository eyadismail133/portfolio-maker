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
  {
    id: "playful",
    name: "Playful",
    feeling: "Friendly and fun, rounded pills, bright tints, a little bounce",
    preferredVariants: { skills: "tags", "work-experience": "cards", education: "cards" },
    defaults: {
      fonts: "soft",
      radius: "pill",
      spacing: "normal",
      mode: "light",
      palette: "sunset",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    feeling: "A magazine: big serif titles, numbered sections, hairline rules",
    preferredVariants: {
      navbar: "centered",
      hero: "centered",
      about: "text",
      projects: "rows",
      testimonials: "single",
      faq: "columns",
      footer: "columns",
    },
    defaults: { fonts: "caslon", radius: "none", spacing: "airy", mode: "light", palette: "ink" },
  },
  {
    id: "brutalist",
    name: "Brutalist",
    feeling: "Raw and loud, thick black borders, hard shadows, flat colors",
    preferredVariants: { "work-experience": "cards", education: "cards", projects: "grid" },
    defaults: {
      fonts: "poster",
      radius: "none",
      spacing: "normal",
      mode: "light",
      palette: "saffron",
    },
  },
  {
    id: "glass",
    name: "Glass",
    feeling: "Modern soft depth, frosted cards over color blooms",
    preferredVariants: { "work-experience": "cards", education: "cards", projects: "grid" },
    defaults: {
      fonts: "jakarta",
      radius: "large",
      spacing: "normal",
      mode: "light",
      palette: "violet",
    },
  },
  {
    id: "gradient",
    name: "Gradient",
    feeling: "Energetic, for startups: mesh gradients, soft glow, large corners",
    preferredVariants: { hero: "centered", features: "grid", pricing: "cards" },
    defaults: {
      fonts: "modern",
      radius: "large",
      spacing: "normal",
      mode: "light",
      palette: "magenta",
    },
  },
  {
    id: "classic-cv",
    name: "Classic CV",
    feeling: "Like a printed CV: compact, formal, headings in a side column",
    preferredVariants: {
      "work-experience": "timeline",
      education: "timeline",
      skills: "tags",
      languages: "list",
      projects: "rows",
      footer: "simple",
    },
    defaults: {
      fonts: "classic",
      radius: "small",
      spacing: "compact",
      mode: "light",
      palette: "navy",
    },
  },
];

export function getFamily(id: string): DesignFamily {
  return families.find((f) => f.id === id) ?? families[0];
}
