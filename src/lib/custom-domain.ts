import { createPublicClient } from "@/lib/supabase/public";

/**
 * Custom domains (Pro): a visitor on a domain that a page owner connected sees that published
 * page. Any host that is not a known custom domain is treated as the app itself, so the app keeps
 * working on whatever address it is given.
 */

function ownHosts(): Set<string> {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const value of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!value) continue;
    try {
      hosts.add(new URL(value.includes("://") ? value : `https://${value}`).hostname);
    } catch {
      // Ignore a malformed setting.
    }
  }
  return hosts;
}

/** True for addresses that certainly belong to the app, so no lookup is needed. */
export function isAppHost(host: string): boolean {
  const name = host.toLowerCase().split(":")[0];
  return (
    ownHosts().has(name) ||
    name.endsWith(".vercel.app") ||
    name.endsWith(".localhost") ||
    !name.includes(".")
  );
}

const remembered = new Map<string, { slug: string | null; until: number }>();

/** The published page a domain shows, or null. Answers are kept for a minute on this server. */
export async function slugForDomain(host: string): Promise<string | null> {
  const domain = host.toLowerCase().split(":")[0];
  const now = Date.now();
  const hit = remembered.get(domain);
  if (hit && hit.until > now) return hit.slug;
  let slug: string | null = null;
  try {
    const { data } = await createPublicClient().rpc("resolve_custom_domain", { p_domain: domain });
    slug = typeof data === "string" && data ? data : null;
  } catch {
    return null;
  }
  if (remembered.size > 5000) remembered.clear();
  remembered.set(domain, { slug, until: now + 60_000 });
  return slug;
}

/**
 * Where a request on a custom domain is served from: "/" is the page, "/en" or "/ar" its other
 * language. The page's own form, visit counter and language links keep working. Anything else
 * is "not found" (null).
 */
export function domainPath(pathname: string, slug: string): string | "pass" | null {
  if (pathname === "/" || pathname === "") return `/p/${slug}`;
  const lang = pathname.match(/^\/(en|ar)\/?$/);
  if (lang) return `/p/${slug}/${lang[1]}`;
  if (pathname === `/p/${slug}` || pathname.startsWith(`/p/${slug}/`)) return "pass";
  if (["/api/contact", "/api/view", "/report", "/robots.txt"].includes(pathname)) return "pass";
  return null;
}

export function normaliseDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

/** A domain people can connect: a real name, not this app or a Vercel address. */
export function domainProblem(domain: string): string | null {
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) || domain.length > 253)
    return "Enter a domain like portfolio.example.com.";
  if (domain.endsWith(".vercel.app") || isAppHost(domain))
    return "Use a domain you own, not this site's own address.";
  return null;
}
