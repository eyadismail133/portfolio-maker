import { safeImageUrl } from "./i18n";
import type { PortfolioDoc } from "./schema/document";

/** The browser-tab icon of a page: the owner's favicon, or else the navbar logo. */
export function pageIcon(doc: PortfolioDoc): string | null {
  const own = safeImageUrl(doc.meta.favicon?.url);
  if (own) return own;
  const navbar = doc.sections.find((s) => s.type === "navbar" && !s.hidden);
  const logo = (navbar?.content as { logo?: { url?: string } } | undefined)?.logo;
  return safeImageUrl(logo?.url);
}
