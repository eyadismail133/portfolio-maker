import { describe, expect, test } from "vitest";
import { getSection } from "@/render-kit/registry";
import { fontPairs } from "@/render-kit/themes/fonts";
import { contrastProblems } from "@/render-kit/themes/color";
import { families } from "@/render-kit/themes/families";
import { getPalette } from "@/render-kit/themes/palettes";
import { ICON_NAMES } from "@/render-kit/sections/icons";
import { BUSINESS } from "../business-content";
import { FIELDS } from "../content";
import { blankStart, generateIdeas, LOOKS } from "../generate";
import { recipeFor } from "../recipes";
import { EMPTY_ANSWERS, GOALS, WHO, type Answers } from "../types";

const answers = (patch: Partial<Answers> = {}): Answers => ({ ...EMPTY_ANSWERS, ...patch });
const text = (value: unknown, lang: "en" | "ar" = "en") =>
  typeof value === "string" ? value : ((value as Record<string, string>)?.[lang] ?? "");
const content = (doc: { sections: { type: string; content: unknown }[] }, type: string) =>
  doc.sections.find((s) => s.type === type)?.content as Record<string, unknown>;

describe("recipes", () => {
  test.each(WHO.flatMap((who) => GOALS.map((goal) => [who, goal] as const)))(
    "%s + %s gives a full, valid page",
    (who, goal) => {
      const { sections, hidden } = recipeFor({ who, goal, assets: [] });
      expect(sections[0]).toBe("navbar");
      expect(sections.at(-1)).toBe("footer");
      expect(sections.length).toBeGreaterThanOrEqual(8);
      expect(new Set(sections).size).toBe(sections.length);
      for (const type of [...sections, ...hidden]) expect(getSection(type), type).toBeDefined();
    },
  );

  test("material the person has ready changes the sections", () => {
    const none = recipeFor({ who: "professional", goal: "hired", assets: [] });
    expect(none.hidden).toContain("testimonials");
    expect(none.sections).not.toContain("cv-download");
    const some = recipeFor({
      who: "professional",
      goal: "hired",
      assets: ["testimonials", "cv", "video", "numbers"],
    });
    expect(some.hidden).not.toContain("testimonials");
    for (const type of ["cv-download", "video", "stats"]) expect(some.sections).toContain(type);
    expect(some.sections.at(-1)).toBe("footer");
    expect(recipeFor({ who: "company", goal: "clients", assets: [] }).hidden).toEqual(
      expect.arrayContaining(["logo-strip", "stats", "testimonials"]),
    );
  });
});

describe("ideas", () => {
  test("six different, valid ideas for every kind of person", () => {
    for (const who of WHO) {
      const ideas = generateIdeas(answers({ who, name: "Test Name" }));
      expect(ideas).toHaveLength(6);
      expect(new Set(ideas.map((i) => i.id)).size).toBe(6);
      const looks = new Set(
        ideas.map((i) => JSON.stringify([i.doc.theme, i.doc.sections.map((s) => s.variant)])),
      );
      expect(looks.size, who).toBe(6);
      for (const idea of ideas) {
        expect(idea.doc.sections.length).toBeGreaterThanOrEqual(8);
        expect(contrastProblems(idea.doc.theme.palette), idea.name).toEqual([]);
      }
    }
  });

  test("the same answers and seed give the same ideas, and another seed gives new ones", () => {
    const a = answers({ who: "freelancer", styles: ["bold"] });
    expect(generateIdeas(a, 0)).toEqual(generateIdeas(a, 0));
    const first = generateIdeas(a, 0).map((i) => JSON.stringify(i.doc.theme));
    const second = generateIdeas(a, 1).map((i) => JSON.stringify(i.doc.theme));
    expect(second).not.toEqual(first);
  });

  test("chosen styles lead and exactly one idea is a surprise", () => {
    const ideas = generateIdeas(answers({ who: "professional", styles: ["tech", "elegant"] }));
    const chosenFamilies = new Set([...LOOKS.tech, ...LOOKS.elegant].map((look) => look.family));
    expect(ideas.slice(0, 5).every((i) => chosenFamilies.has(i.doc.theme.family))).toBe(true);
    expect(ideas[5].note).toMatch(/^Something different/);
  });

  test("name, title, field, colors, mode and languages reach the page", () => {
    const [idea] = generateIdeas(
      answers({
        who: "professional",
        field: "finance",
        name: "Mona Adel",
        title: "Tax advisor",
        palette: "pine",
        mode: "dark",
        languages: ["ar", "en"],
      }),
    );
    expect(text(content(idea.doc, "hero").name)).toBe("Mona Adel");
    expect(text(content(idea.doc, "hero").title)).toBe("Tax advisor");
    expect(text(content(idea.doc, "navbar").brand)).toBe("Mona Adel");
    expect(text(content(idea.doc, "about").body, "ar")).toContain("المراجعة");
    expect(idea.doc.theme.palette).toEqual(getPalette("pine").light);
    expect(idea.doc.theme.mode).toBe("dark");
    expect(idea.doc.meta.languages).toEqual(["ar", "en"]);
    expect(idea.doc.meta.title).toBe("Mona Adel, Tax advisor");
  });

  test("a company gets its name as the brand and a headline as the big text", () => {
    const [idea] = generateIdeas(
      answers({ who: "company", field: "software", name: "Delta Labs" }),
    );
    expect(text(content(idea.doc, "hero").title)).toBe("Delta Labs");
    expect(text(content(idea.doc, "hero").name)).toMatch(/Software that ships/);
    expect(
      text(
        content(idea.doc, "services").items &&
          (content(idea.doc, "services").items as { title: unknown }[])[0].title,
      ),
    ).toBe("Web apps");
  });

  test("a brand color is used for every idea", () => {
    const ideas = generateIdeas(answers({ brandColor: "#ff6600" }));
    expect(new Set(ideas.map((i) => i.doc.theme.palette.primary)).size).toBe(1);
  });

  test("a blank start has only the frame of a page", () => {
    const doc = blankStart(answers({ name: "Sara" }));
    expect(doc.sections.map((s) => s.type)).toEqual(["navbar", "hero", "footer"]);
    expect(text(content(doc, "hero").name)).toBe("Sara");
  });
});

describe("content and looks", () => {
  test("at least ten fields, each complete in English and Arabic", () => {
    expect(FIELDS.length).toBeGreaterThanOrEqual(10);
    for (const field of FIELDS) {
      for (const value of [field.name, field.title, field.headline, field.intro, field.about]) {
        expect(text(value, "en"), field.id).not.toBe("");
        expect(text(value, "ar"), field.id).not.toBe("");
      }
      expect(field.skills.length).toBeGreaterThanOrEqual(6);
      expect(field.services).toHaveLength(3);
      for (const service of field.services)
        expect(ICON_NAMES, `${field.id} ${service.icon}`).toContain(service.icon);
    }
  });

  test("every field has company text for steps, questions and a case study", () => {
    for (const field of FIELDS) {
      const pack = BUSINESS[field.id];
      expect(pack, field.id).toBeDefined();
      const texts = [
        ...pack.steps.flatMap((s) => [s.title, s.description]),
        ...pack.faq.flatMap((q) => [q.question, q.answer]),
        ...Object.values(pack.caseStudy).filter((v) => !Array.isArray(v)),
        ...pack.caseStudy.stats.map((s) => s.label),
      ];
      for (const value of texts) {
        expect(text(value, "en"), field.id).not.toBe("");
        expect(text(value, "ar"), field.id).not.toBe("");
      }
    }
  });

  test("company sections use the field's own text and still pass their schema", () => {
    const ideas = generateIdeas(answers({ who: "company", field: "medicine", name: "Al Amal" }));
    let checked = 0;
    for (const idea of ideas) {
      for (const section of idea.doc.sections) {
        if (!["faq", "how-it-works", "case-study"].includes(section.type)) continue;
        expect(getSection(section.type)!.schema.safeParse(section.content).success).toBe(true);
        checked += 1;
      }
      const faq = content(idea.doc, "faq");
      if (faq) expect(text((faq.items as { question: unknown }[])[0].question)).toMatch(/insurance/);
    }
    expect(checked).toBeGreaterThan(0);
  });

  test("every look points at a real family and real fonts", () => {
    for (const look of Object.values(LOOKS).flat()) {
      expect(
        families.some((f) => f.id === look.family),
        look.name,
      ).toBe(true);
      if (look.fonts)
        expect(
          fontPairs.some((f) => f.id === look.fonts),
          look.name,
        ).toBe(true);
    }
  });
});

describe("onboarding picture", () => {
  const asset = { assetId: "a1", url: "https://x.test/a.webp", alt: "Sara", width: 800, height: 800 };

  test("a photo goes into the hero and a logo into the navbar", async () => {
    const { withPicture } = await import("../picture");
    const [idea] = generateIdeas(answers({ name: "Sara" }));
    const photo = withPicture(idea.doc, asset, "photo");
    expect((content(photo, "hero").image as { url: string }).url).toBe(asset.url);
    const logo = withPicture(idea.doc, asset, "logo");
    expect((content(logo, "navbar").logo as { url: string }).url).toBe(asset.url);
    expect(content(logo, "hero").image).toEqual(content(idea.doc, "hero").image);
  });
});
