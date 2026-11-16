import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { CSS_FAMILIES, CSS_FILES, CSS_HEAD, CSS_TAIL, PAGE_CSS } from "../generated/page-css";
import { pageCss } from "../page-css";
import { allSections, normalizeDoc } from "../registry";
import { Renderer } from "../Renderer";
import { createSampleDoc } from "../samples";
import { families } from "../themes/families";

/** Selectors of a stylesheet, one by one (inside media queries too). */
function selectors(css: string): string[] {
  return [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) =>
    m[1]
      .trim()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const EVERY_PAGE = new Set(["pk-root", "pk-section", "pk-container", "pk-js"]);

const cases = allSections().flatMap((def) =>
  Object.keys(def.variants).map((variant) => [def.type, variant] as const),
);

describe("a page carries only the stylesheet it needs", () => {
  test.each(cases)("%s / %s keeps every rule that applies to it", (type, variant) => {
    const doc = createSampleDoc({ sections: [`${type}:${variant}`] });
    const html = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />);
    const used = new Set(
      [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean),
    );
    const css = pageCss(doc);
    const missing: string[] = [];
    for (const [name, fileCss] of Object.entries(CSS_FILES)) {
      if (css.includes(fileCss)) continue;
      // A rule whose classes all appear on the page would style it: its file must be there.
      const applies = selectors(fileCss).find((sel) => {
        const classes = [...sel.matchAll(/\.(pk-[a-z0-9_-]+)/g)].map((m) => m[1]);
        // Classes every page has say nothing about which sections a rule is for.
        const telling = classes.filter((c) => !EVERY_PAGE.has(c));
        return telling.length > 0 && classes.every((c) => used.has(c));
      });
      if (applies) missing.push(`${name}: ${applies}`);
    }
    expect(missing).toEqual([]);
  });

  test("only the page's own design family and the sections it shows are included", () => {
    const doc = normalizeDoc({ ...createSampleDoc({ sections: ["hero:split", "faq:cards"] }) });
    const css = pageCss(doc);
    expect(css.startsWith(CSS_HEAD)).toBe(true);
    expect(css.endsWith(CSS_TAIL)).toBe(true);
    expect(css).toContain(CSS_FAMILIES[doc.theme.family]);
    const other = families.find((f) => f.id !== doc.theme.family)!;
    expect(css).not.toContain(CSS_FAMILIES[other.id]);
    expect(css).toContain(CSS_FILES["faq/faq.css"]);
    expect(css).not.toContain(CSS_FILES["pricing/pricing.css"]);
    expect(css.length).toBeLessThan(PAGE_CSS.length / 2);
  });

  test("hidden sections add nothing", () => {
    const base = createSampleDoc({ sections: ["hero:split", "pricing:cards"] });
    const doc = {
      ...base,
      sections: base.sections.map((s) => ({ ...s, hidden: s.type === "pricing" })),
    };
    expect(pageCss(doc)).not.toContain(CSS_FILES["pricing/pricing.css"]);
  });
});
