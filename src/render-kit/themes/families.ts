export type DesignFamily = {
  id: string;
  name: string;
  feeling: string;
  /** Variant each section type prefers in this family. Missing types use the section default. */
  preferredVariants: Record<string, string>;
  defaults: {
    fonts: string;
    radius: "none" | "small" | "large" | "pill";
    spacing: "compact" | "normal" | "airy";
  };
};

/** Design families. Each one also has a CSS file in styles/families/. */
export const families: DesignFamily[] = [
  {
    id: "minimal",
    name: "Minimal",
    feeling: "Calm, lots of white space, one accent color",
    preferredVariants: {},
    defaults: { fonts: "grotesk", radius: "small", spacing: "normal" },
  },
];

export function getFamily(id: string): DesignFamily {
  return families.find((f) => f.id === id) ?? families[0];
}
