import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { renderToHtml } from "../export";
import { PAGE_CSS } from "../generated/page-css";
import { allSections, normalizeDoc } from "../registry";
import { Renderer } from "../Renderer";
import { createSampleDoc } from "../samples";
import { fillItemIds, migrateDoc, nextItemId, SCHEMA_VERSION } from "../schema";
import type { PortfolioDoc } from "../schema";

/** Every object found inside a list, at any depth. */
function listItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "object" && item !== null && !Array.isArray(item)
        ? Object.keys(item).every((k) => k === "en" || k === "ar")
          ? []
          : [item as Record<string, unknown>, ...listItems(item)]
        : listItems(item),
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(listItems);
  }
  return [];
}

/** A copy with every item id removed, as documents were saved before version 2. */
function withoutIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutIds);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, v]) => [key, withoutIds(v)]),
    );
  }
  return value;
}

/** A version 1 document: the sample of every section, without item ids or element styles. */
function versionOneDoc(): Record<string, unknown> {
  const doc = createSampleDoc({ kind: "everything" });
  return {
    ...doc,
    schemaVersion: 1,
    sections: doc.sections.map((s) => ({ ...s, content: withoutIds(s.content) })),
  };
}

function withSection(doc: PortfolioDoc, patch: Record<string, unknown>): PortfolioDoc {
  return normalizeDoc({ ...doc, sections: [{ ...doc.sections[0], ...patch }] });
}

describe("item ids", () => {
  test("the version 1 to 2 migration gives every list item an id unique in its section", () => {
    const migrated = migrateDoc(versionOneDoc()) as { sections: { content: unknown }[] };
    expect(SCHEMA_VERSION).toBe(2);
    let items = 0;
    for (const section of migrated.sections) {
      const ids = listItems(section.content).map((item) => item.id);
      items += ids.length;
      expect(ids.every((id) => typeof id === "string" && /^i\d+$/.test(id))).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(items).toBeGreaterThan(50);
  });

  test("ids are stable: loading a document twice keeps them", () => {
    const once = normalizeDoc(versionOneDoc());
    const twice = normalizeDoc(once);
    expect(twice).toEqual(once);
  });

  test("every section schema keeps the ids of its list items", () => {
    for (const def of allSections()) {
      const parsed = def.schema.parse(fillItemIds(def.defaults()));
      for (const item of listItems(parsed)) {
        expect(typeof item.id, `${def.type}: ${JSON.stringify(item).slice(0, 60)}`).toBe("string");
      }
    }
  });

  test("filling keeps existing ids, renumbers copies and leaves complete content untouched", () => {
    const content = { items: [{ id: "i4", a: 1 }, { a: 2 }, { id: "i4", a: 3 }] };
    const filled = fillItemIds(content);
    expect(filled.items.map((item) => item.id)).toEqual(["i4", "i5", "i6"]);
    expect(fillItemIds(filled)).toBe(filled);
    expect(nextItemId(["i2", "x", "i10"])).toBe("i11");
  });

  test("plain text lists get no ids", () => {
    const tags = [{ en: "Design", ar: "تصميم" }, "b"];
    const filled = fillItemIds({ tags, items: [{ points: ["x"] }] });
    expect(filled).toEqual({ tags, items: [{ points: ["x"], id: "i1" }] });
  });
});

describe("element styles", () => {
  const base = createSampleDoc({ sections: ["projects:grid"] });
  const firstItem = () => {
    const content = base.sections[0].content as { items: { id: string }[] };
    return content.items[0].id;
  };

  test("bad keys and values are dropped without failing the document", () => {
    const doc = withSection(base, {
      elements: {
        heading: { color: "primary", size: "nope" },
        "bad key!": { color: "primary" },
        subheading: "not an object",
        empty: {},
      },
    });
    expect(doc.sections[0].elements).toEqual({});
    const ok = withSection(base, { elements: { heading: { color: "primary" } } });
    expect(ok.sections[0].elements).toEqual({ heading: { color: "primary" } });
  });

  test("the page draws element styles as pk-e classes on the heading and on items", () => {
    const doc = withSection(base, {
      elements: {
        heading: { color: "accent", size: "huge", align: "center" },
        [firstItem()]: { weight: "bold" },
      },
    });
    const html = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />);
    expect(html).toContain('class="pk-h2 pk-e-c-accent pk-e-s-huge pk-e-a-center"');
    expect(html).toContain('class="pk-project pk-e-w-bold"');
  });

  test("a hidden element is left out of the page but stays visible in the editor", () => {
    const doc = withSection(base, { elements: { heading: { hidden: true } } });
    const page = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />);
    expect(page).toMatch(/<h2 class="pk-h2" hidden="">/);
    const editor = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} editing />);
    expect(editor).toContain('data-pk-el-hidden=""');
    expect(editor).not.toMatch(/<h2[^>]* hidden=""/);
  });

  test("only the editor preview marks elements", () => {
    const doc = createSampleDoc({ kind: "everything" });
    const editor = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} editing />);
    expect(editor).toContain('data-pk-el="heading"');
    expect(editor).toContain(`data-pk-el="${firstItem()}"`);
    expect(renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />)).not.toContain(
      "data-pk-el",
    );
    expect(renderToHtml(doc)).not.toContain("data-pk-el");
  });
});

describe("every shown field can be picked in the editor", () => {
  type Field = { key: string; type: string; fields?: Field[] };
  const photo = (url: string) => ({ assetId: url, url, alt: "", width: 800, height: 600 });
  const setPath = (target: Record<string, unknown>, key: string, value: unknown) => {
    const parts = key.split(".");
    let node = target;
    for (const part of parts.slice(0, -1)) {
      node[part] = { ...((node[part] as Record<string, unknown>) ?? {}) };
      node = node[part] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  };
  /** A unique value per field, so where it shows in the page tells which field it came from. */
  const marker = (field: Field, tag: string) => {
    if (field.type === "image") return photo(`https://cdn.example/${tag}.webp`);
    if (field.type === "link") return { label: `MK${tag}MK`, href: "https://x.example" };
    return `MK${tag}MK`;
  };
  const shown = (field: Field, tag: string, html: string) =>
    html.includes(field.type === "image" ? `cdn.example/${tag}.webp` : `MK${tag}MK`);
  const checked = ["text", "longtext", "image", "link"];

  const cases = allSections().flatMap((def) =>
    Object.keys(def.variants).map((variant) => [def.type, variant] as const),
  );

  test.each(cases)("%s / %s", (type, variant) => {
    const def = allSections().find((d) => d.type === type)!;
    const content = structuredClone(fillItemIds(def.defaults())) as Record<string, unknown>;
    const fields = def.fields as Field[];
    const expected: string[] = [];
    fields.forEach((field, f) => {
      if (checked.includes(field.type)) {
        setPath(content, field.key, marker(field, `f${f}`));
        expected.push(field.key);
      }
      // Photos inside list items: the first item's photo.
      if (field.type === "list" && Array.isArray(content[field.key])) {
        const first = (content[field.key] as Record<string, unknown>[])[0];
        for (const sub of field.fields ?? []) {
          if (first && sub.type === "image") first[sub.key] = marker(sub, `f${f}${sub.key}`);
        }
      }
    });
    const doc = normalizeDoc({
      ...createSampleDoc({ sections: [] }),
      sections: [{ id: "s", type, variant, content }],
    });
    const html = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} editing />);
    const missing: string[] = [];
    fields.forEach((field, f) => {
      if (checked.includes(field.type) && shown(field, `f${f}`, html)) {
        if (!html.includes(`data-pk-el="${field.key}"`)) missing.push(field.key);
      }
      if (field.type === "list") {
        const first = (doc.sections[0].content as Record<string, { id: string }[]>)[field.key]?.[0];
        for (const sub of field.fields ?? []) {
          if (first && sub.type === "image" && shown(sub, `f${f}${sub.key}`, html)) {
            if (!html.includes(`data-pk-el="${first.id}.${sub.key}"`)) {
              missing.push(`${field.key}[].${sub.key}`);
            }
          }
        }
      }
    });
    expect(missing).toEqual([]);
  });
});

describe("swap sides", () => {
  test("a flipped photo carries pk-e-flip and the page stylesheet mirrors its container", () => {
    const base = createSampleDoc({ sections: ["hero:split"] });
    const doc = normalizeDoc({
      ...base,
      sections: [{ ...base.sections[0], elements: { image: { flip: true } } }],
    });
    const page = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />);
    expect(page).toMatch(/class="[^"]*pk-hero__image[^"]*pk-e-flip/);
    expect(PAGE_CSS).toContain(":has(> .pk-e-flip)");
  });
});

describe("top or bottom of a block", () => {
  test("the hero buttons can go above the text", () => {
    const base = createSampleDoc({ sections: ["hero:split"] });
    const doc = normalizeDoc({
      ...base,
      sections: [{ ...base.sections[0], elements: { actions: { order: "first" } } }],
    });
    const page = renderToStaticMarkup(<Renderer doc={doc} fontLink={false} />);
    expect(page).toContain('class="pk-hero__actions pk-e-o-first"');
    expect(PAGE_CSS).toMatch(/\.pk-e-o-first \{\n {2}order: -1;/);
    expect(PAGE_CSS).toMatch(/\.pk-hero__copy \{\n {2}display: grid;/);
  });
});
