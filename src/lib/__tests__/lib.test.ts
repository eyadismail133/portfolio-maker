import { describe, expect, test } from "vitest";
import { cleanTitle, friendlyError, isOffline } from "../portfolios";
import { needsAccount, safeNext } from "../supabase/proxy";
import { fitWithin } from "../upload";

describe("route protection", () => {
  test("only private pages need an account", () => {
    for (const path of ["/dashboard", "/dashboard/x", "/editor/123", "/pro/done", "/account"])
      expect(needsAccount(path), path).toBe(true);
    for (const path of [
      "/",
      "/editor",
      "/new",
      "/new/ideas",
      "/login",
      "/preview",
      "/dashboards",
      "/pro",
    ]) {
      expect(needsAccount(path), path).toBe(false);
    }
  });

  test("after login people only go to pages of this site", () => {
    expect(safeNext("/editor/abc?x=1")).toBe("/editor/abc?x=1");
    for (const bad of [
      null,
      "",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
    ]) {
      expect(safeNext(bad), String(bad)).toBe("/dashboard");
    }
  });
});

describe("portfolio helpers", () => {
  test("titles are trimmed, capped and never empty", () => {
    expect(cleanTitle("  My site  ")).toBe("My site");
    expect(cleanTitle("   ")).toBe("Untitled portfolio");
    expect(cleanTitle("x".repeat(300))).toHaveLength(120);
  });

  test("errors are turned into advice", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/No connection/);
    expect(friendlyError({ message: 'relation "public.portfolios" does not exist' })).toMatch(
      /0001_init\.sql/,
    );
    expect(friendlyError({ message: "new row violates row-level security policy" })).toMatch(
      /Log in again/,
    );
    expect(isOffline(new TypeError("Failed to fetch"))).toBe(true);
    expect(isOffline({ message: "duplicate key" })).toBe(false);
  });
});

describe("image sizes", () => {
  test("large images shrink to 2000 pixels and keep their shape", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(1000, 6000)).toEqual({ width: 333, height: 2000 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe("PDF CV", () => {
  test("is built from the visible sections, as plain text, in either language", async () => {
    const { buildCv } = await import("../cv");
    const { createSampleDoc } = await import("@/render-kit/samples");
    const { normalizeDoc } = await import("@/render-kit/registry");
    const doc = normalizeDoc(createSampleDoc({ languages: ["en", "ar"] }));
    const en = buildCv(doc, "en");
    expect(en.name).toBe("Layla Hassan");
    expect(en.experience.length).toBeGreaterThan(0);
    expect(en.experience[0].when).toMatch(/Present/);
    expect(en.skills.length).toBeGreaterThan(0);
    expect(JSON.stringify(en)).not.toMatch(/\*\*/);
    const ar = buildCv(doc, "ar");
    expect(ar.headings.experience).not.toBe(en.headings.experience);
    const hidden = {
      ...doc,
      sections: doc.sections.map((s) =>
        s.type === "work-experience" ? { ...s, hidden: true } : s,
      ),
    };
    expect(buildCv(hidden, "en").experience).toEqual([]);
  });
});

describe("custom domains", () => {
  test("the app's own addresses never need a lookup", async () => {
    const { isAppHost } = await import("../custom-domain");
    for (const host of ["localhost:3000", "portfolio-maker.vercel.app", "x-git-main.vercel.app"])
      expect(isAppHost(host), host).toBe(true);
    expect(isAppHost("layla.dev")).toBe(false);
  });

  test("a domain shows only its page", async () => {
    const { domainPath } = await import("../custom-domain");
    expect(domainPath("/", "layla")).toBe("/p/layla");
    expect(domainPath("/ar", "layla")).toBe("/p/layla/ar");
    expect(domainPath("/api/contact", "layla")).toBe("pass");
    expect(domainPath("/p/layla/en", "layla")).toBe("pass");
    expect(domainPath("/dashboard", "layla")).toBeNull();
    expect(domainPath("/p/other", "layla")).toBeNull();
  });

  test("domain input is cleaned and checked", async () => {
    const { domainProblem, normaliseDomain } = await import("../custom-domain");
    expect(normaliseDomain(" https://Layla.DEV/about ")).toBe("layla.dev");
    expect(domainProblem("layla.dev")).toBeNull();
    expect(domainProblem("localhost")).not.toBeNull();
    expect(domainProblem("x.vercel.app")).not.toBeNull();
    expect(domainProblem("bad domain.com")).not.toBeNull();
  });
});

describe("emails", () => {
  test("user text is escaped and a plain text copy is made", async () => {
    const { renderEmail } = await import("../email");
    const { html, text } = renderEmail({
      to: "a@b.co",
      subject: "s",
      paragraphs: ['<script>alert("x")</script>'],
      action: { label: "Open", href: "https://x.co/?a=1&b=2" },
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a=1&amp;b=2");
    expect(text).toContain("Open: https://x.co/?a=1&b=2");
  });

  test("nothing is sent without the email settings", async () => {
    const { sendEmail } = await import("../email");
    expect(await sendEmail({ to: "a@b.co", subject: "s", paragraphs: [] })).toBe(false);
  });
});

describe("templates", () => {
  test("one per design family, each opening a valid page", async () => {
    const { TEMPLATES, templateDoc } = await import("../templates");
    const { families } = await import("@/render-kit/themes/families");
    expect(TEMPLATES).toHaveLength(families.length);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) expect(templateDoc(t.id)?.theme.family).toBe(t.family);
    expect(templateDoc("nope")).toBeNull();
  });
});

describe("daily job", () => {
  test("refuses callers without the cron secret", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { GET } = await import("@/app/api/cron/daily/route");
    const { NextRequest } = await import("next/server");
    const response = await GET(new NextRequest("http://x/api/cron/daily"));
    expect(response.status).toBe(401);
    const wrong = await GET(
      new NextRequest("http://x/api/cron/daily", { headers: { authorization: "Bearer no" } }),
    );
    expect(wrong.status).toBe(401);
    delete process.env.CRON_SECRET;
  });
});

describe("screenshot comparison", () => {
  test("same pictures match, changed ones do not", async () => {
    const { PNG } = await import("pngjs");
    const { difference } = await import("../../../scripts/png-diff");
    const make = (paint: (x: number, y: number) => number) => {
      const png = new PNG({ width: 10, height: 10 });
      for (let y = 0; y < 10; y++)
        for (let x = 0; x < 10; x++) {
          const i = (y * 10 + x) * 4;
          png.data[i] = png.data[i + 1] = png.data[i + 2] = paint(x, y);
          png.data[i + 3] = 255;
        }
      return PNG.sync.write(png);
    };
    const white = make(() => 255);
    expect(
      difference(
        white,
        make(() => 255),
      ).share,
    ).toBe(0);
    expect(
      difference(
        white,
        make((x) => (x < 5 ? 0 : 255)),
      ).share,
    ).toBe(0.5);
    expect(
      difference(
        white,
        make(() => 250),
      ).share,
    ).toBe(0);
  });
});
