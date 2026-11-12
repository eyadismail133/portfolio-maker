import { beforeEach, describe, expect, test } from "vitest";
import { allSections, type FieldDef } from "@/render-kit/registry";
import { createSampleDoc } from "@/render-kit/samples";
import * as ops from "../doc-ops";
import { useEditor } from "../store";

const types = (doc: { sections: { type: string }[] }) => doc.sections.map((s) => s.type);

describe("document operations", () => {
  const doc = createSampleDoc({ sections: ["navbar", "hero", "about", "skills", "footer"] });

  test("setAt copies only the changed branch", () => {
    const source = { a: { b: [1, 2] }, c: { d: 1 } };
    const next = ops.setAt(source, ["a", "b", 1], 9);
    expect(next).toEqual({ a: { b: [1, 9] }, c: { d: 1 } });
    expect(next.c).toBe(source.c);
    expect(source.a.b[1]).toBe(2);
  });

  test("new sections go before the footer, or after the chosen section", () => {
    expect(types(ops.addSection(doc, "faq")!.doc)).toEqual([
      "navbar",
      "hero",
      "about",
      "skills",
      "faq",
      "footer",
    ]);
    expect(types(ops.addSection(doc, "faq", undefined, "hero")!.doc)).toEqual([
      "navbar",
      "hero",
      "faq",
      "about",
      "skills",
      "footer",
    ]);
    expect(types(ops.addSection(doc, "faq", undefined, "footer")!.doc).at(-1)).toBe("footer");
    expect(ops.addSection(doc, "nope")).toBeNull();
  });

  test("added and duplicated sections get their own id and valid content", () => {
    const added = ops.addSection(doc, "skills")!;
    expect(added.id).toBe("skills-2");
    const copy = ops.duplicateSection(added.doc, "skills")!;
    expect(copy.id).toBe("skills-3");
    expect(new Set(copy.doc.sections.map((s) => s.id)).size).toBe(copy.doc.sections.length);
  });

  test("pinned sections do not move and nothing moves past them", () => {
    expect(ops.canMove(doc, "navbar", 1)).toBe(false);
    expect(ops.canMove(doc, "hero", -1)).toBe(false);
    expect(ops.canMove(doc, "skills", 1)).toBe(false);
    expect(types(ops.moveSection(doc, "hero", 1))).toEqual([
      "navbar",
      "about",
      "hero",
      "skills",
      "footer",
    ]);
    expect(types(ops.moveSectionTo(doc, "skills", "hero"))).toEqual([
      "navbar",
      "skills",
      "hero",
      "about",
      "footer",
    ]);
    expect(ops.moveSectionTo(doc, "hero", "footer")).toBe(doc);
  });

  test("invalid content is refused and missing values are filled in", () => {
    const hero = doc.sections.find((s) => s.id === "hero")!;
    expect(ops.setContent(doc, "hero", { ...(hero.content as object), name: 42 })).toBeNull();
    const skills = ops.setContent(doc, "skills", { heading: "Skills", groups: [{}] })!;
    const content = skills.sections.find((s) => s.id === "skills")!.content as {
      groups: { items: unknown[] }[];
    };
    expect(content.groups[0].items).toEqual([]);
  });

  test("text is kept per language only when there are two languages", () => {
    expect(ops.writeLocalized("Hi", "en", "Hello", ["en"])).toBe("Hello");
    expect(ops.writeLocalized("Hi", "ar", "أهلاً", ["en", "ar"])).toEqual({ en: "Hi", ar: "أهلاً" });
    expect(ops.writeLocalized({ en: "Hi" }, "en", "Hello", ["en", "ar"])).toEqual({ en: "Hello" });
    expect(ops.readLocalized({ en: "Hi" }, "ar")).toBe("");
    expect(ops.otherLanguageText({ en: "Hi" }, "ar")).toBe("Hi");
  });
});

describe("editor store", () => {
  beforeEach(() =>
    useEditor.getState().load(createSampleDoc({ sections: ["navbar", "hero", "about", "footer"] })),
  );
  const state = () => useEditor.getState();

  test("undo and redo walk through changes", () => {
    state().addSection("faq");
    state().toggleHidden("about");
    expect(types(state().doc!)).toContain("faq");
    expect(state().selectedId).toBe("faq");
    state().undo();
    expect(state().doc!.sections.find((s) => s.id === "about")!.hidden).toBe(false);
    state().undo();
    expect(types(state().doc!)).not.toContain("faq");
    expect(state().selectedId).toBeNull();
    state().redo();
    expect(types(state().doc!)).toContain("faq");
    state().removeSection("hero");
    expect(state().future).toHaveLength(0);
  });

  test("typing in one field is one undo step", () => {
    const hero = state().doc!.sections.find((s) => s.id === "hero")!.content as Record<
      string,
      unknown
    >;
    for (const name of ["L", "La", "Lay"])
      state().updateContent("hero", { ...hero, name }, "hero:name");
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(
      (state().doc!.sections.find((s) => s.id === "hero")!.content as { name: unknown }).name,
    ).toEqual(hero.name);
  });

  test("a refused edit changes nothing", () => {
    const before = state().doc;
    state().updateContent("hero", { name: 42 });
    expect(state().doc).toBe(before);
    expect(state().past).toHaveLength(0);
  });

  test("changing the design keeps content and removing a language resets the editing language", () => {
    const content = state().doc!.sections.map((s) => s.content);
    state().setFamily("bold");
    expect(state().doc!.theme.family).toBe("bold");
    expect(state().doc!.sections.map((s) => s.content)).toEqual(content);
    state().setLang("ar");
    state().setLanguages(["en"]);
    expect(state().lang).toBe("en");
  });
});

describe("section forms", () => {
  /** The shape the editor's form expects for each field type. */
  function check(field: FieldDef, value: unknown, where: string) {
    const kind = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    const expected: Record<FieldDef["type"], string[]> = {
      text: ["string", "object"],
      longtext: ["string", "object"],
      url: ["string"],
      link: ["object", "undefined"],
      image: ["object", "undefined"],
      month: ["string"],
      "end-month": ["string"],
      level: ["number", "undefined"],
      icon: ["string"],
      toggle: ["boolean"],
      select: ["string"],
      "text-list": ["array"],
      list: ["array"],
    };
    expect(expected[field.type], `${where} is ${kind}`).toContain(kind);
    if (field.type === "list") {
      expect(field.fields?.length, `${where} needs item fields`).toBeGreaterThan(0);
      for (const [i, item] of (value as Record<string, unknown>[]).entries()) {
        for (const sub of field.fields ?? [])
          check(sub, item[sub.key], `${where}[${i}].${sub.key}`);
      }
    }
  }

  test.each(allSections().map((def) => [def.type, def] as const))(
    "%s: fields match its content",
    (_, def) => {
      const content = def.schema.parse(def.defaults()) as Record<string, unknown>;
      for (const field of def.fields)
        check(field, ops.getAt(content, field.key.split(".")), `${def.type}.${field.key}`);
    },
  );

  test.each(allSections().map((def) => [def.type, def] as const))(
    "%s: a new list item is accepted",
    (_, def) => {
      const content = def.schema.parse(def.defaults()) as Record<string, unknown>;
      for (const field of def.fields.filter((f) => f.type === "list")) {
        const next = { ...content, [field.key]: [...(content[field.key] as unknown[]), {}] };
        expect(def.schema.safeParse(next).success, `${def.type}.${field.key}`).toBe(true);
      }
    },
  );
});
