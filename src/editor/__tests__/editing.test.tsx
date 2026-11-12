import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { plainText, richBlocks, RichBlocks, RichInline } from "@/render-kit/rich-text";
import { createSampleDoc } from "@/render-kit/samples";
import { clampOffset, cropArea } from "../CropDialog";
import { findTextPath, getAt, setTextAt } from "../doc-ops";
import { link, toggleList, wrap } from "../format";

describe("rich text", () => {
  test("marks become elements and nothing becomes HTML", () => {
    const html = renderToStaticMarkup(
      <RichInline
        text={"**Bold** and *soft* and [site](https://x.example) <script>alert(1)</script>"}
      />,
    );
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>soft</em>");
    expect(html).toContain('href="https://x.example"');
    expect(html).toContain("&lt;script&gt;");
  });

  test("unsafe links are removed", () => {
    expect(renderToStaticMarkup(<RichInline text="[x](javascript:alert(1))" />)).toContain(
      'href="#"',
    );
  });

  test("lists and paragraphs", () => {
    expect(richBlocks("Intro\n- one\n- two\nAfter")).toEqual([
      { kind: "p", text: "Intro" },
      { kind: "ul", items: ["one", "two"] },
      { kind: "p", text: "After" },
    ]);
    expect(renderToStaticMarkup(<RichBlocks text={"- a\n- b"} />)).toContain(
      "<li><span>a</span></li>",
    );
  });

  test("plain text drops the marks", () => {
    expect(plainText("**A** *b* [c](https://d)\n- e")).toBe("A b c\ne");
  });
});

describe("formatting buttons", () => {
  test("bold wraps the selection, or a placeholder", () => {
    expect(wrap({ text: "hello world", start: 6, end: 11 }, "**", "**", "bold")).toEqual({
      text: "hello **world**",
      start: 8,
      end: 13,
    });
    expect(wrap({ text: "hi ", start: 3, end: 3 }, "*", "*", "italic").text).toBe("hi *italic*");
  });

  test("link selects the address to type over", () => {
    const result = link({ text: "see site", start: 4, end: 8 }, "link");
    expect(result.text).toBe("see [site](https://)");
    expect(result.text.slice(result.start, result.end)).toBe("https://");
  });

  test("list turns lines on and off", () => {
    const on = toggleList({ text: "a\nb\nc", start: 0, end: 3 });
    expect(on.text).toBe("- a\n- b\nc");
    expect(toggleList({ text: on.text, start: 0, end: 7 }).text).toBe("a\nb\nc");
  });
});

describe("editing in the preview", () => {
  const doc = createSampleDoc({ sections: ["hero", "work-experience"], languages: ["en", "ar"] });
  const hero = doc.sections[0].content;
  const work = doc.sections[1].content;

  test("finds the text that was clicked, in either language", () => {
    expect(findTextPath(hero, "en", "Layla Hassan")).toEqual(["name"]);
    expect(findTextPath(hero, "ar", "ليلى حسن")).toEqual(["name"]);
    expect(findTextPath(work, "en", "Nile Pay")).toEqual(["items", 0, "company"]);
    expect(findTextPath(hero, "en", "Something not on the page")).toBeNull();
  });

  test("writes the new text only into the language being edited", () => {
    const next = setTextAt(doc, "hero", ["name"], "Eyad Ismail", "en")!;
    const name = getAt(next.sections[0].content, ["name"]) as { en: string; ar: string };
    expect(name.en).toBe("Eyad Ismail");
    expect(name.ar).toBe("ليلى حسن");
  });

  test("texts with marks are left to the form", () => {
    const marked = { ...(hero as Record<string, unknown>), intro: "I **design** apps" };
    expect(findTextPath(marked, "en", "I design apps")).toBeNull();
  });
});

describe("crop", () => {
  const image = { width: 2000, height: 1000 };
  const box = { width: 400, height: 400 };

  test("a square crop of a wide picture keeps the middle", () => {
    const area = cropArea(image, box, 1, { x: 0, y: 0 });
    expect(area.width).toBeCloseTo(1000);
    expect(area.height).toBeCloseTo(1000);
    expect(area.x).toBeCloseTo(500);
  });

  test("zooming in takes a smaller part, and the picture always covers the frame", () => {
    expect(cropArea(image, box, 2, { x: 0, y: 0 }).width).toBeCloseTo(500);
    expect(clampOffset(image, box, 1, { x: 9999, y: 50 })).toEqual({ x: 200, y: 0 });
  });
});
