import { CSS_FAMILIES, CSS_FILES, CSS_HEAD, CSS_NEEDS, CSS_TAIL } from "./generated/page-css";
import type { PortfolioDoc } from "./schema/document";
import { getFamily } from "./themes/families";

/**
 * The stylesheet one page needs: the base rules, its own design family, the stylesheets of the
 * sections it shows (and any they borrow from), and the shared style rules. Published pages and
 * downloads carry this instead of every family and every section.
 */
export function pageCss(doc: PortfolioDoc): string {
  const family = getFamily(doc.theme.family).id;
  const used = new Set(
    doc.sections.filter((s) => !s.hidden).flatMap((s) => CSS_NEEDS[s.type] ?? []),
  );
  const sections = Object.entries(CSS_FILES)
    .filter(([name]) => used.has(name))
    .map(([, css]) => css)
    .join("");
  return CSS_HEAD + (CSS_FAMILIES[family] ?? "") + sections + CSS_TAIL;
}
