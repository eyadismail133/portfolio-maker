import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const rpc = vi.fn(async () => ({ data: null, error: null }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ rpc }) }));

const { POST } = await import("@/app/api/view/route");

const visit = (slug: string, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest(`https://app.example/api/view?slug=${slug}`, {
      method: "POST",
      headers: { "user-agent": "Mozilla/5.0", ...headers },
    }),
  );

beforeEach(() => rpc.mockClear());

describe("visit counter", () => {
  test("the first visit counts and leaves a 30-minute cookie for this page only", async () => {
    const res = await visit("layla");
    expect(res.status).toBe(204);
    expect(rpc).toHaveBeenCalledWith("record_page_view", { p_slug: "layla" });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("pk_v_layla=1");
    expect(cookie).toContain("Max-Age=1800");
    expect(cookie).toContain("Path=/api/view");
    expect(cookie).toContain("HttpOnly");
  });

  test("the same browser is not counted again within the window", async () => {
    expect((await visit("layla", { cookie: "pk_v_layla=1" })).status).toBe(204);
    expect(rpc).not.toHaveBeenCalled();
  });

  test("another page still counts", async () => {
    await visit("omar", { cookie: "pk_v_layla=1" });
    expect(rpc).toHaveBeenCalledWith("record_page_view", { p_slug: "omar" });
  });

  test("robots and bad link names are never counted", async () => {
    await visit("layla", { "user-agent": "Googlebot/2.1" });
    await visit("NOT_A_SLUG");
    expect(rpc).not.toHaveBeenCalled();
  });
});
