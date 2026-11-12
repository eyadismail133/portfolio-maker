import { getSection } from "../registry";
import type { PortfolioDoc } from "../schema/document";
import { getFamily } from "./families";
import { getPalette } from "./palettes";

/**
 * Switches a portfolio to another design family in one step. Content is never touched:
 * only the theme changes, and each section moves to the layout the family prefers.
 */
export function applyFamily(
  doc: PortfolioDoc,
  familyId: string,
  options: { keepColors?: boolean } = {},
): PortfolioDoc {
  const family = getFamily(familyId);
  const palette = getPalette(family.defaults.palette);
  return {
    ...doc,
    theme: {
      ...doc.theme,
      family: family.id,
      fonts: family.defaults.fonts,
      radius: family.defaults.radius,
      spacing: family.defaults.spacing,
      ...(options.keepColors
        ? {}
        : { mode: family.defaults.mode, palette: palette.light, paletteDark: palette.dark }),
    },
    sections: doc.sections.map((section) => {
      const def = getSection(section.type);
      const wanted = family.preferredVariants[section.type] ?? def?.defaultVariant;
      return wanted && def?.variants[wanted] ? { ...section, variant: wanted } : section;
    }),
  };
}
