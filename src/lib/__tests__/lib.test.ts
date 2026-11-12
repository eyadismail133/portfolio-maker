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
