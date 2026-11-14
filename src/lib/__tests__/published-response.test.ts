import { describe, expect, test, vi } from "vitest";
import { createSampleDoc } from "@/render-kit/samples";
import { normalizeDoc } from "@/render-kit/registry";

const doc = normalizeDoc(createSampleDoc({ languages: ["en", "ar"] }));
// Outside Next.js the page cache does nothing; every call draws the page.
vi.mock("next/cache", () => ({ cacheLife: () => undefined, cacheTag: () => undefined }));
vi.mock("@/lib/published", () => ({
  publishedTag: (slug: string) => `published:${slug}`,
  getPublished: async (slug: string) =>
    slug === "layla" ? { title: "Layla", doc, publishedAt: "", showBadge: true } : null,
}));

const { publishedResponse } = await import("../published-response");
const request = (path: string) =>
  new Request(`https://app.example${path}`, { headers: { host: "portfolio-maker.vercel.app" } });

describe("published pages", () => {
  test("the whole page is in the HTML, with nothing hidden for scripts to reveal", async () => {
    const res = await publishedResponse(request("/p/layla"), "layla");
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('class="pk-root');
    expect(html).not.toMatch(/<div hidden|<template id="B:/);
    expect(html).toContain('action="/api/contact?slug=layla"');
    expect(html).toContain("Made with Portfolio Maker");
    expect(html).toContain("/report?page=layla");
    expect(html).toContain(
      '<link rel="canonical" href="https://portfolio-maker.vercel.app/p/layla">',
    );
    expect(html).toContain("/api/og?slug=layla&amp;lang=en");
    expect(html).toContain('hreflang="ar" href="/p/layla/ar"');
  });

  test("the other language and unknown pages", async () => {
    const ar = await (await publishedResponse(request("/p/layla/ar"), "layla", "ar")).text();
    expect(ar).toContain('<html lang="ar" dir="rtl">');
    expect((await publishedResponse(request("/p/layla/en"), "layla", "en")).status).toBe(404);
    expect((await publishedResponse(request("/p/layla/fr"), "layla", "fr")).status).toBe(404);
    expect((await publishedResponse(request("/p/nobody"), "nobody")).status).toBe(404);
  });

  test("on the owner's own domain links stay on that domain", async () => {
    const res = await publishedResponse(
      new Request("https://layla.dev/", { headers: { host: "layla.dev" } }),
      "layla",
    );
    const html = await res.text();
    expect(html).toContain('<link rel="canonical" href="https://layla.dev/">');
    expect(html).toContain('hreflang="ar" href="/ar"');
  });

  test("the spam check key is on our own hostnames only, and only when it is switched on", async () => {
    const own = () =>
      publishedResponse(
        new Request("https://layla.dev/", { headers: { host: "layla.dev" } }),
        "layla",
      );
    expect(await (await publishedResponse(request("/p/layla"), "layla")).text()).not.toContain(
      '<meta name="pk-turnstile"',
    );
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-1");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-1");
    try {
      expect(await (await publishedResponse(request("/p/layla"), "layla")).text()).toContain(
        '<meta name="pk-turnstile" content="site-key-1">',
      );
      expect(await (await own()).text()).not.toContain('<meta name="pk-turnstile"');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
