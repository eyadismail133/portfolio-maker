import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, test } from "vitest";
import { generateIdeas } from "@/recommend/generate";
import { EMPTY_ANSWERS } from "@/recommend/types";
import { buildExportZip, collectImageUrls, pageFileNames, renderToHtml } from "@/render-kit/export";
import { PAGE_CSS } from "@/render-kit/generated/page-css";
import { PAGE_SCRIPT } from "@/render-kit/page-script";
import { normalizeDoc } from "@/render-kit/registry";
import { createSampleDoc } from "@/render-kit/samples";
import { renderKitCss } from "../../../scripts/bundle-css";
import { publishChecks } from "../publish-checks";
import { signupsCsv } from "../publishing";
import { cleanSlugInput, RESERVED_SLUGS, slugProblem, suggestSlug } from "../slug";

describe("link names", () => {
  test("good and bad link names", () => {
    for (const ok of ["layla", "nile-ledger", "a1b", "x".repeat(50)])
      expect(slugProblem(ok), ok).toBeNull();
    for (const bad of [
      "ab",
      "-abc",
      "abc-",
      "a--b",
      "ABC",
      "a b",
      "x".repeat(51),
      "dashboard",
      "api",
    ]) {
      expect(slugProblem(bad), bad).not.toBeNull();
    }
  });

  test("typing is cleaned into the allowed shape", () => {
    expect(cleanSlugInput("Layla Hassan!")).toBe("layla-hassan-");
    expect(cleanSlugInput("Café  Nour")).toBe("cafe-nour");
    expect(cleanSlugInput("--x")).toBe("x");
  });

  test("suggestions are always valid", () => {
    expect(suggestSlug("Layla Hassan, product designer")).toBe("layla-hassan");
    for (const title of ["", "ليلى حسن", "Al", "Dashboard", "!!!"])
      expect(slugProblem(suggestSlug(title)), title).toBeNull();
  });

  test("the reserved list matches the database migration", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync("supabase/migrations/0002_publishing.sql", "utf8");
    for (const slug of RESERVED_SLUGS) expect(sql, slug).toContain(`'${slug}'`);
  });
});

describe("publish checks", () => {
  test("a fresh sample warns about sample text and title", () => {
    const ids = publishChecks(createSampleDoc()).map((c) => c.id);
    expect(ids).toContain("sample-text");
    expect(ids).toContain("title");
  });

  test("a starter idea warns about its sample text too", () => {
    const [idea] = generateIdeas({ ...EMPTY_ANSWERS, field: "finance", name: "Mona" });
    expect(publishChecks(idea.doc).map((c) => c.id)).toContain("sample-text");
  });

  test("own content, a title and a contact section pass", () => {
    const doc = normalizeDoc({
      ...createSampleDoc({ sections: [], languages: ["en"] }),
      meta: { title: "Mona Adel", description: "", languages: ["en"] },
      sections: [
        {
          id: "hero",
          type: "hero",
          variant: "split",
          content: { name: "Mona Adel", title: "Tax advisor" },
        },
        {
          id: "contact",
          type: "contact",
          variant: "form",
          content: { heading: "Write to me", email: "mona@example.com" },
        },
      ],
    });
    expect(publishChecks(doc)).toEqual([]);
  });

  test("images without a description and missing translations are found", () => {
    const doc = normalizeDoc({
      ...createSampleDoc({ sections: [] }),
      meta: { title: "Mona", description: "", languages: ["en", "ar"] },
      sections: [
        {
          id: "hero",
          type: "hero",
          variant: "split",
          content: {
            name: { en: "Mona" },
            image: {
              assetId: "a",
              url: "https://x.example/a.webp",
              alt: "",
              width: 10,
              height: 10,
            },
          },
        },
        { id: "contact", type: "contact", variant: "form", content: { email: "m@example.com" } },
      ],
    });
    const ids = publishChecks(doc).map((c) => c.id);
    expect(ids).toContain("alt");
    expect(ids).toContain("translation");
  });
});

describe("HTML export", () => {
  const image = {
    assetId: "a",
    url: "https://cdn.example/a.webp",
    alt: "Me",
    width: 10,
    height: 10,
  };
  const doc = normalizeDoc({
    ...createSampleDoc({
      sections: ["navbar", "hero", "gallery", "contact", "footer"],
      languages: ["en", "ar"],
    }),
  });
  doc.sections[1] = {
    ...doc.sections[1],
    content: { ...(doc.sections[1].content as object), image },
  };

  test("finds every image", () => {
    expect([...collectImageUrls(doc)]).toEqual(["https://cdn.example/a.webp"]);
  });

  test("one page per language, local images, stylesheet and script", async () => {
    const result = await buildExportZip(doc, {
      css: PAGE_CSS,
      script: PAGE_SCRIPT,
      fetchImage: async () => ({ bytes: new Uint8Array([1, 2, 3]), type: "image/webp" }),
    });
    expect(result.files).toEqual([
      "README.txt",
      "ar.html",
      "images/1.webp",
      "index.html",
      "script.js",
      "styles.css",
    ]);
    const files = unzipSync(result.zip);
    const index = strFromU8(files["index.html"]);
    expect(index).toContain('src="images/1.webp"');
    expect(index).toContain('<link rel="stylesheet" href="styles.css">');
    expect(index).toContain('<script src="script.js" defer></script>');
    expect(index).toContain('href="ar.html"');
    expect(strFromU8(files["ar.html"])).toContain('dir="rtl"');
    expect(strFromU8(files["ar.html"])).toContain('href="index.html"');
    expect(result.missingImages).toEqual([]);
  });

  test("images that cannot be downloaded stay online", async () => {
    const result = await buildExportZip(doc, { css: "", script: "", fetchImage: async () => null });
    expect(result.missingImages).toEqual(["https://cdn.example/a.webp"]);
    expect(strFromU8(unzipSync(result.zip)["index.html"])).toContain("https://cdn.example/a.webp");
  });

  test("published pages send the contact form to the inbox; exports open email", () => {
    expect(renderToHtml(doc, { formAction: "/api/contact?slug=mona" })).toContain(
      'action="/api/contact?slug=mona"',
    );
    expect(renderToHtml(doc)).toContain('action="mailto:');
  });

  test("newsletter sign-ups go to the inbox unless the owner set a mailing list", () => {
    const withNews = normalizeDoc(createSampleDoc({ sections: ["newsletter"], languages: ["en"] }));
    const html = renderToHtml(withNews, { formAction: "/api/contact?slug=mona" });
    expect(html).toContain('action="/api/contact?slug=mona&amp;kind=signup"');
    expect(html).toContain("data-pk-contact");
    const own = {
      ...withNews,
      sections: withNews.sections.map((s) =>
        s.type === "newsletter"
          ? { ...s, content: { ...(s.content as object), action: "https://list.example/sub" } }
          : s,
      ),
    };
    expect(renderToHtml(own, { formAction: "/api/contact?slug=mona" })).toContain(
      'action="https://list.example/sub"',
    );
  });

  test("sign-up CSV quotes cells and defuses formulas", () => {
    const csv = signupsCsv(
      [
        { id: "1", portfolioId: "p", email: "=cmd@x.co", createdAt: "2026-11-01T10:00:00Z" },
        { id: "2", portfolioId: "p", email: "a@b.co", createdAt: "2026-11-02T10:00:00Z" },
      ],
      { p: 'My "page"' },
    );
    expect(csv.split("\r\n")).toEqual([
      "email,page,date",
      `"'=cmd@x.co","My ""page""","2026-11-01"`,
      `"a@b.co","My ""page""","2026-11-02"`,
    ]);
  });

  test("file names per language", () => {
    expect(pageFileNames(["ar", "en"])).toEqual({ ar: "index.html", en: "en.html" });
  });

  test("the generated stylesheet is up to date", () => {
    const fresh =
      renderKitCss()
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\n\s*\n+/g, "\n")
        .trim() + "\n";
    expect(PAGE_CSS).toBe(fresh);
  });

  test("the page script parses", () => {
    expect(() => new Function(PAGE_SCRIPT)).not.toThrow();
  });
});
