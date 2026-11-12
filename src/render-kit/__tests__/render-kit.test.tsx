import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { renderToHtml } from "../export";
import { formatRange, pickText, safeHref, safeImageUrl } from "../i18n";
import { allSections, normalizeDoc } from "../registry";
import { Renderer } from "../Renderer";
import { createSampleDoc } from "../samples";
import { migrateDoc, SCHEMA_VERSION } from "../schema";
import { applyFamily } from "../themes/apply";
import {
  buildPalette,
  contrastProblems,
  contrastRatio,
  ensureContrast,
  fixPalette,
} from "../themes/color";
import { families } from "../themes/families";
import { fontPairs, getFontPair, googleFontsUrl } from "../themes/fonts";
import { palettes } from "../themes/palettes";

describe("document", () => {
  test("sample document is valid and uses every section", () => {
    const doc = createSampleDoc();
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.sections.map((s) => s.type).sort()).toEqual(
      allSections()
        .map((s) => s.type)
        .sort(),
    );
  });

  test("normalizeDoc drops unknown sections and repairs unknown variants", () => {
    const doc = createSampleDoc({ sections: ["hero"] });
    const raw = {
      ...doc,
      sections: [
        { ...doc.sections[0], variant: "nope" },
        { id: "x", type: "not-a-section", variant: "a", content: {} },
      ],
    };
    const fixed = normalizeDoc(raw);
    expect(fixed.sections).toHaveLength(1);
    expect(fixed.sections[0].variant).toBe("split");
  });

  test("normalizeDoc rejects a broken theme", () => {
    const doc = createSampleDoc();
    expect(() =>
      normalizeDoc({
        ...doc,
        theme: { ...doc.theme, palette: { ...doc.theme.palette, primary: "red;}" } },
      }),
    ).toThrow();
  });

  test("migrations run in order up to the target version", () => {
    const steps = {
      1: (d: Record<string, unknown>) => ({ ...d, a: 1 }),
      2: (d: Record<string, unknown>) => ({ ...d, b: 2 }),
    };
    expect(migrateDoc({ schemaVersion: 1 }, steps, 3)).toEqual({ schemaVersion: 3, a: 1, b: 2 });
    expect(() => migrateDoc({ schemaVersion: 1 }, {}, 2)).toThrow(/No migration/);
    expect(() => migrateDoc({ schemaVersion: 99 })).toThrow(/newer/);
  });
});

describe("sections", () => {
  const combos = allSections().flatMap((def) =>
    Object.keys(def.variants).map((variant) => [def.type, variant] as const),
  );

  test("every section has at least two variants, fields and valid sample content", () => {
    for (const def of allSections()) {
      expect(Object.keys(def.variants).length, def.type).toBeGreaterThanOrEqual(2);
      expect(def.fields.length, def.type).toBeGreaterThan(0);
      expect(def.schema.safeParse(def.defaults()).success, def.type).toBe(true);
    }
  });

  test.each(combos)("%s / %s renders in English and Arabic", (type, variant) => {
    const doc = createSampleDoc({ sections: [`${type}:${variant}`] });
    for (const lang of ["en", "ar"] as const) {
      const html = renderToStaticMarkup(<Renderer doc={doc} lang={lang} fontLink={false} />);
      expect(html).toContain(`pk-${type}--${variant}`);
      expect(html).toContain(lang === "ar" ? 'dir="rtl"' : 'dir="ltr"');
    }
  });

  test.each(combos)("%s / %s renders with empty content", (type, variant) => {
    const doc = normalizeDoc({
      ...createSampleDoc({ sections: [] }),
      sections: [{ id: "s", type, variant, content: {} }],
    });
    expect(doc.sections).toHaveLength(1);
    expect(() => renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />)).not.toThrow();
  });

  test("user text is escaped and unsafe links are removed", () => {
    const doc = normalizeDoc({
      ...createSampleDoc({ sections: [] }),
      sections: [
        {
          id: "hero",
          type: "hero",
          variant: "split",
          content: {
            name: "<script>alert(1)</script>",
            primaryCta: { label: "Go", href: "javascript:alert(1)" },
          },
        },
      ],
    });
    const html = renderToHtml(doc);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("javascript:");
  });

  test("hidden sections are not rendered and the navbar links to the visible ones", () => {
    const doc = createSampleDoc();
    doc.sections.find((s) => s.type === "education")!.hidden = true;
    const html = renderToHtml(doc);
    expect(html).not.toContain('id="education"');
    expect(html).not.toContain('href="#education"');
    expect(html).toContain('href="#about"');
  });
});

describe("theme", () => {
  test("every ready palette passes contrast in light and dark", () => {
    for (const p of palettes) {
      expect(contrastProblems(p.light), `${p.id} light`).toEqual([]);
      expect(contrastProblems(p.dark), `${p.id} dark`).toEqual([]);
    }
  });

  test("a palette built from any brand color is readable", () => {
    for (const brand of ["#ffee00", "#ffffff", "#000000", "#ff0066", "#7fffd4", "#123456"]) {
      expect(contrastProblems(buildPalette(brand, "light")), brand).toEqual([]);
      expect(contrastProblems(buildPalette(brand, "dark")), brand).toEqual([]);
    }
  });

  test("fixPalette repairs unreadable colors", () => {
    const bad = {
      ...palettes[0].light,
      text: "#eeeeee",
      mutedText: "#dddddd",
      onPrimary: palettes[0].light.primary,
    };
    expect(contrastProblems(bad).length).toBeGreaterThan(0);
    expect(contrastProblems(fixPalette(bad))).toEqual([]);
  });

  test("ensureContrast keeps colors that already pass", () => {
    expect(ensureContrast("#000000", "#ffffff")).toBe("#000000");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  test("font link loads the Arabic partner only when needed", () => {
    const pair = fontPairs[0];
    expect(googleFontsUrl(pair.id, ["en"])).not.toContain(pair.arabic.family.replace(/ /g, "+"));
    expect(googleFontsUrl(pair.id, ["en", "ar"])).toContain(pair.arabic.family.replace(/ /g, "+"));
  });
});

describe("design families", () => {
  test("every family has a stylesheet, real fonts, a real palette and real variants", async () => {
    const { readFileSync } = await import("node:fs");
    const index = readFileSync("src/render-kit/styles/index.css", "utf8");
    for (const family of families) {
      expect(index, family.id).toContain(`./families/${family.id}.css`);
      expect(getFontPair(family.defaults.fonts).id, family.id).toBe(family.defaults.fonts);
      expect(
        palettes.some((p) => p.id === family.defaults.palette),
        family.id,
      ).toBe(true);
      for (const [type, variant] of Object.entries(family.preferredVariants)) {
        const def = allSections().find((s) => s.type === type);
        expect(def?.variants[variant], `${family.id}: ${type}.${variant}`).toBeDefined();
      }
    }
  });

  test("switching family keeps all content and changes theme and layouts", () => {
    const before = createSampleDoc();
    const after = applyFamily(before, "elegant");
    expect(after.sections.map((s) => s.content)).toEqual(before.sections.map((s) => s.content));
    expect(after.theme.family).toBe("elegant");
    expect(after.theme.fonts).toBe("couture");
    expect(after.sections.find((s) => s.type === "hero")?.variant).toBe("centered");
    expect(applyFamily(before, "tech", { keepColors: true }).theme.palette).toEqual(
      before.theme.palette,
    );
    expect(() => renderToHtml(normalizeDoc(after))).not.toThrow();
  });
});

describe("text helpers", () => {
  test("pickText falls back to the other language", () => {
    expect(pickText({ en: "Hi" }, "ar")).toBe("Hi");
    expect(pickText({ en: "Hi", ar: "أهلاً" }, "ar")).toBe("أهلاً");
    expect(pickText("Same", "ar")).toBe("Same");
    expect(pickText(undefined, "en")).toBe("");
  });

  test("date ranges", () => {
    expect(formatRange("2022-03", "current", "en")).toBe("Mar 2022 – Present");
    expect(formatRange("2018", "2018", "en")).toBe("2018");
    expect(formatRange("", "", "en")).toBe("");
  });

  test("link and image addresses are filtered", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("#about")).toBe("#about");
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("//evil.example")).toBe("#");
    expect(safeImageUrl("data:image/svg+xml,<svg>")).toBeNull();
    expect(safeImageUrl("/images/a.webp")).toBe("/images/a.webp");
  });
});
