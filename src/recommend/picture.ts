import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { AssetRef } from "@/render-kit/schema/primitives";

export type PictureKind = "photo" | "logo";

/**
 * Puts the picture from onboarding into a starter page: a logo goes in the navbar, a photo in
 * the hero. Sections that are missing are left alone.
 */
export function withPicture(doc: PortfolioDoc, asset: AssetRef, kind: PictureKind): PortfolioDoc {
  const target = kind === "logo" ? { type: "navbar", key: "logo" } : { type: "hero", key: "image" };
  let done = false;
  const sections = doc.sections.map((section) => {
    if (done || section.type !== target.type) return section;
    done = true;
    return { ...section, content: { ...(section.content as object), [target.key]: asset } };
  });
  return { ...doc, sections };
}
