import { getSection } from "../registry";
import type { PortfolioDoc, Theme } from "../schema/document";

/**
 * Helpers that make two portfolios built from the same sample look different: other layouts
 * and other page-wide touches. They take a random number source so callers decide whether the
 * result is repeatable (starter ideas) or not (the Shuffle button).
 */
export type Random = () => number;

const pick = <T>(items: readonly T[], next: Random): T =>
  items[Math.floor(next() * items.length) % items.length];

/**
 * Sections whose layouts can be swapped freely: every layout works with the same content.
 * Left out on purpose: contact (only one layout has a form), about (one needs a photo) and
 * the rest, whose layouts mean different content.
 */
export const VARIED_SECTIONS = [
  "navbar",
  "hero",
  "work-experience",
  "education",
  "skills",
  "projects",
  "gallery",
  "team",
  "testimonials",
  "certificates",
  "stats",
  "features",
  "cta",
  "footer",
] as const;

/** Gives some of the swappable sections another layout. `share` is how many, from 0 to 1. */
export function varyLayouts(doc: PortfolioDoc, next: Random, share = 0.5): PortfolioDoc {
  return {
    ...doc,
    sections: doc.sections.map((section) => {
      const def = getSection(section.type);
      if (!def || !(VARIED_SECTIONS as readonly string[]).includes(section.type)) return section;
      if (next() >= share) return section;
      return { ...section, variant: pick(Object.keys(def.variants), next) };
    }),
  };
}

const TOUCHES = {
  imageShape: ["square", "rounded", "circle", "arch", "blob", "tilted"],
  buttons: ["solid", "outline", "soft", "underline"],
  headingDeco: ["none", "underline", "marker", "number", "line"],
  pattern: ["dots", "grid", "lines", "glow", "noise"],
} as const;

/**
 * A random set of page-wide touches. Each one is left to the design about half of the time,
 * so results stay close to the family they started from.
 */
export function randomTouches(next: Random): Partial<Theme> {
  const touches: Partial<Theme> = {};
  for (const [key, options] of Object.entries(TOUCHES)) {
    if (next() < 0.5) Object.assign(touches, { [key]: pick(options, next) });
  }
  if (next() < 0.15) touches.headingCase = "upper";
  return touches;
}
