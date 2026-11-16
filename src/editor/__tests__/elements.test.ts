import { beforeEach, describe, expect, test } from "vitest";
import { createSampleDoc } from "@/render-kit/samples";
import * as ops from "../doc-ops";
import { useEditor } from "../store";

const doc = () => createSampleDoc({ sections: ["projects:grid", "hero:split"] });
const projects = () => doc().sections[0];
type Projects = { items: { id: string; image?: { url: string } }[] };

describe("element styles in the document", () => {
  test("styles merge, undefined goes back to the design, empty elements disappear", () => {
    const start = doc();
    const id = start.sections[0].id;
    const a = ops.setElementStyle(start, id, "heading", { color: "primary", size: "large" })!;
    expect(a.sections[0].elements).toEqual({ heading: { color: "primary", size: "large" } });
    const b = ops.setElementStyle(a, id, "heading", { size: undefined })!;
    expect(b.sections[0].elements).toEqual({ heading: { color: "primary" } });
    const c = ops.setElementStyle(b, id, "heading", null)!;
    expect(c.sections[0]).not.toHaveProperty("elements");
  });

  test("bad keys, bad values and unknown sections change nothing", () => {
    const start = doc();
    const id = start.sections[0].id;
    expect(ops.setElementStyle(start, id, "bad key", { color: "primary" })).toBeNull();
    expect(
      ops.setElementStyle(start, id, "heading", { color: "red" } as unknown as { color: "text" }),
    ).toBeNull();
    expect(ops.setElementStyle(start, "nope", "heading", { color: "primary" })).toBeNull();
  });
});

describe("element keys and content paths", () => {
  test("an item id leads to its place in the list, and back", () => {
    const content = projects().content as Projects;
    const second = content.items[1].id;
    expect(ops.elementPath(content, second)).toEqual(["items", 1]);
    expect(ops.elementPath(content, `${second}.image`)).toEqual(["items", 1, "image"]);
    expect(ops.elementPath(content, "heading")).toEqual(["heading"]);
    expect(ops.elementKeyFor(content, ["items", 1])).toBe(second);
    expect(ops.elementKeyFor(content, ["items", 1, "image"])).toBe(`${second}.image`);
    expect(ops.elementKeyFor(content, ["heading"])).toBe("heading");
  });

  test("a photo is found by its address", () => {
    const photo = (url: string) => ({ assetId: url, url, alt: "", width: 10, height: 10 });
    const content = {
      image: photo("https://cdn.example/hero.webp"),
      items: [{ id: "i1" }, { id: "i2", image: photo("https://cdn.example/p2.webp") }],
    };
    expect(ops.assetPath(content, "https://cdn.example/p2.webp")).toEqual(["items", 1, "image"]);
    expect(ops.assetPath(content, "https://cdn.example/hero.webp")).toEqual(["image"]);
    expect(ops.assetPath(content, "https://elsewhere.example/x.webp")).toBeNull();
  });
});

describe("editor store", () => {
  beforeEach(() => useEditor.getState().load(doc()));

  test("picking an element, styling it and undoing is one step each", () => {
    const { select, setElementStyle } = useEditor.getState();
    const id = useEditor.getState().doc!.sections[0].id;
    select(id, "heading");
    expect(useEditor.getState().selectedEl).toBe("heading");
    setElementStyle(id, "heading", { weight: "bold" });
    setElementStyle(id, "heading", { align: "center" });
    expect(useEditor.getState().doc!.sections[0].elements?.heading).toEqual({
      weight: "bold",
      align: "center",
    });
    useEditor.getState().undo();
    expect(useEditor.getState().doc!.sections[0].elements?.heading).toEqual({ weight: "bold" });
    expect(useEditor.getState().selectedEl).toBe("heading");
  });

  test("the picked element is dropped with its section", () => {
    const id = useEditor.getState().doc!.sections[0].id;
    useEditor.getState().select(id, "heading");
    useEditor.getState().removeSection(id);
    expect(useEditor.getState().selectedId).toBeNull();
    expect(useEditor.getState().selectedEl).toBeNull();
    useEditor.getState().select(null, "heading");
    expect(useEditor.getState().selectedEl).toBeNull();
  });
});

describe("moving list items", () => {
  const ids = (d: ReturnType<typeof doc> | null) =>
    (d!.sections[0].content as Projects).items.map((item) => item.id);

  test("an item moves to another item's place and keeps its id", () => {
    const start = doc();
    const id = start.sections[0].id;
    const [a, b, c] = ids(start);
    expect(ids(ops.moveItemTo(start, id, a, c))).toEqual([b, c, a]);
    expect(ids(ops.moveItemTo(start, id, c, a))).toEqual([c, a, b]);
    expect(ids(ops.moveItemBy(start, id, b, -1))).toEqual([b, a, c]);
  });

  test("moves past the ends, onto itself or into another list change nothing", () => {
    const start = doc();
    const id = start.sections[0].id;
    const [a, , c] = ids(start);
    expect(ops.moveItemBy(start, id, a, -1)).toBeNull();
    expect(ops.moveItemBy(start, id, c, 1)).toBeNull();
    expect(ops.moveItemTo(start, id, a, a)).toBeNull();
    const nested = createSampleDoc({ sections: ["skills:cards"] });
    const content = nested.sections[0].content as {
      groups: { id: string; items: { id: string }[] }[];
    };
    if (content.groups.length < 2) throw new Error("the skills sample needs two groups");
    const fromFirst = content.groups[0].items[0].id;
    const inSecond = content.groups[1].items[0].id;
    expect(ops.moveItemTo(nested, nested.sections[0].id, fromFirst, inSecond)).toBeNull();
  });
});

describe("swap sides in the document", () => {
  test("flip is saved like any element choice and goes with a reset", () => {
    const start = doc();
    const id = start.sections[1].id;
    const flipped = ops.setElementStyle(start, id, "image", { flip: true })!;
    expect(flipped.sections[1].elements).toEqual({ image: { flip: true } });
    expect(ops.setElementStyle(flipped, id, "image", null)!.sections[1]).not.toHaveProperty(
      "elements",
    );
  });
});
