/** Rules for the link name of a published portfolio, the part after /p/. Matches the database checks. */

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "dev",
  "editor",
  "help",
  "login",
  "logout",
  "new",
  "p",
  "preview",
  "pricing",
  "privacy",
  "settings",
  "signup",
  "support",
  "terms",
  "www",
]);

const SHAPE = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

/** What is wrong with a link name, or null when it is fine. */
export function slugProblem(slug: string): string | null {
  if (slug.length < 3) return "Use at least 3 characters.";
  if (slug.length > 50) return "Use at most 50 characters.";
  if (!SHAPE.test(slug))
    return "Use only small letters a to z, numbers and dashes, not at the start or end.";
  if (slug.includes("--")) return "Use one dash at a time.";
  if (RESERVED_SLUGS.has(slug)) return "This name is kept for the site itself. Choose another.";
  return null;
}

/** Turns any typing into the allowed shape as people type: lowercase, dashes for spaces. */
export function cleanSlugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "")
    .slice(0, 50);
}

/** A good first suggestion from the portfolio name. Arabic-only names fall back to "my-portfolio". */
export function suggestSlug(title: string): string {
  const base = cleanSlugInput(title.split(",")[0] ?? "").replace(/-+$/, "");
  if (!slugProblem(base)) return base;
  const padded = `${base || "my"}-portfolio`.replace(/^-/, "");
  return slugProblem(padded) ? "my-portfolio" : padded;
}
