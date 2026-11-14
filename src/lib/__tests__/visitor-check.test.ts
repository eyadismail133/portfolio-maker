import { afterEach, describe, expect, test, vi } from "vitest";

const domains: Record<string, string> = { "layla.dev": "layla" };
vi.mock("@/lib/custom-domain", () => ({
  isAppHost: (host: string) => host.endsWith(".vercel.app"),
  slugForDomain: async (host: string) => domains[host] ?? null,
}));

const { passesTurnstile, turnstileSiteKey, visitorMaySend } = await import("../visitor-check");

const turnOn = () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
};
const cloudflareSays = (success: boolean) => {
  const fetchMock = vi.fn(async () => Response.json({ success }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};
const post = (host: string) =>
  new Request("https://x/api/contact", { method: "POST", headers: { host } });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("spam check", () => {
  test("off until both keys are set; then everything passes without asking Cloudflare", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchMock = cloudflareSays(false);
    expect(turnstileSiteKey()).toBeNull();
    expect(await passesTurnstile("", null)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("when on, Cloudflare decides, and a missing token never passes", async () => {
    turnOn();
    expect(turnstileSiteKey()).toBe("site-key");
    const fetchMock = cloudflareSays(true);
    expect(await passesTurnstile("token", "1.2.3.4")).toBe(true);
    const sent = fetchMock.mock.calls[0] as unknown as [string, { body: URLSearchParams }];
    expect(sent[1].body.get("secret")).toBe("secret");
    expect(sent[1].body.get("remoteip")).toBe("1.2.3.4");
    expect(await passesTurnstile("", null)).toBe(false);
    cloudflareSays(false);
    expect(await passesTurnstile("token", null)).toBe(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("down"))),
    );
    expect(await passesTurnstile("token", null)).toBe(false);
  });

  test("custom domains skip the check but may only send to their own page", async () => {
    turnOn();
    const fetchMock = cloudflareSays(false);
    expect(await visitorMaySend(post("layla.dev"), "layla", "")).toBe(true);
    expect(await visitorMaySend(post("layla.dev"), "someone-else", "")).toBe(false);
    expect(await visitorMaySend(post("unknown.example"), "layla", "")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await visitorMaySend(post("portfolio-maker.vercel.app"), "layla", "")).toBe(false);
  });
});
