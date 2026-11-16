import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PAGE_CSS } from "../generated/page-css";
import { normalizeDoc } from "../registry";
import { Renderer } from "../Renderer";
import { createSampleDoc } from "../samples";
import { fontPairs, googleFontsUrl, sectionFontIds } from "../themes/fonts";
import { sectionLook } from "../themes/section-style";

const palette = createSampleDoc().theme.palette;

describe("section choices from Phase 8C", () => {
  test("columns, photo shape, shadow and heading look become data attributes", () => {
    const look = sectionLook(
      {
        background: "default",
        padding: "normal",
        columns: "3",
        ratio: "square",
        shadow: "strong",
        headingEffect: "gradient",
      },
      palette,
    );
    expect(look.attrs).toMatchObject({
      "data-pk-columns": "3",
      "data-pk-ratio": "square",
      "data-pk-shadow": "strong",
      "data-pk-heffect": "gradient",
    });
    expect(PAGE_CSS).toContain('.pk-section[data-pk-columns="3"]');
    expect(PAGE_CSS).toContain('.pk-section[data-pk-ratio="square"] .pk-media');
  });

  test("a section font sets the section's font variables, in Arabic order on Arabic pages", () => {
    const pair = fontPairs[2];
    const en = sectionLook(
      { background: "default", padding: "normal", font: pair.id },
      palette,
      "en",
    );
    const ar = sectionLook(
      { background: "default", padding: "normal", font: pair.id },
      palette,
      "ar",
    );
    expect(en.vars["--pk-font-heading"].startsWith(`'${pair.heading.family}'`)).toBe(true);
    expect(ar.vars["--pk-font-heading"].startsWith(`'${pair.arabic.family}'`)).toBe(true);
  });

  test("the page loads the fonts chosen for single sections", () => {
    const base = createSampleDoc({ sections: ["about:text", "faq:cards"] });
    const pair = fontPairs.find((p) => p.id !== base.theme.fonts)!;
    const doc = normalizeDoc({
      ...base,
      sections: base.sections.map((s, i) =>
        i === 1 ? { ...s, style: { background: "default", padding: "normal", font: pair.id } } : s,
      ),
    });
    expect(sectionFontIds(doc.sections)).toEqual([pair.id]);
    const url = googleFontsUrl(doc.theme, doc.meta.languages, sectionFontIds(doc.sections));
    expect(url).toContain(pair.heading.family.replace(/ /g, "+"));
    const html = renderToStaticMarkup(<Renderer doc={doc} />);
    expect(html).toContain(pair.heading.family.replace(/ /g, "+"));
    expect(html).toContain("--pk-font-heading");
  });

  test("bad values are refused like every other style value", () => {
    const base = createSampleDoc({ sections: ["faq:cards"] });
    const bad = (style: Record<string, unknown>) => () =>
      normalizeDoc({
        ...base,
        sections: [
          { ...base.sections[0], style: { background: "default", padding: "normal", ...style } },
        ],
      });
    expect(bad({ font: "x;}body{" })).toThrow();
    expect(bad({ columns: "9" })).toThrow();
  });
});
