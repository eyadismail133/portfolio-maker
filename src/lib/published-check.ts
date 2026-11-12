import { createPublicClient } from "@/lib/supabase/public";

/**
 * A quick check, run before a published page is rendered, so that missing pages answer with a
 * real 404 status (the page itself streams, and a stream cannot change its status any more).
 * Answers are remembered briefly on this server to keep visits fast.
 */
const remembered = new Map<string, { languages: string[] | null; until: number }>();
const FOUND_MS = 60_000;
const MISSING_MS = 10_000;

/** The page's languages, or null when there is no published page with this link name. */
async function publishedLanguages(slug: string): Promise<string[] | null> {
  const now = Date.now();
  const hit = remembered.get(slug);
  if (hit && hit.until > now) return hit.languages;
  const { data, error } = await createPublicClient().rpc("get_published_portfolio", {
    p_slug: slug,
  });
  // When the database cannot be asked, let the page itself decide.
  if (error) throw error;
  const doc = (data as { doc?: { meta?: { languages?: unknown } } }[] | null)?.[0]?.doc;
  const languages = doc
    ? Array.isArray(doc.meta?.languages) && doc.meta.languages.length > 0
      ? (doc.meta.languages as string[])
      : ["en"]
    : null;
  if (remembered.size > 5000) remembered.clear();
  remembered.set(slug, { languages, until: now + (languages ? FOUND_MS : MISSING_MS) });
  return languages;
}

/** True when the address /p/<slug> or /p/<slug>/<lang> has nothing to show. */
export async function isMissingPublishedPage(pathname: string): Promise<boolean> {
  const match = pathname.match(/^\/p\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!match) return false;
  const [, slug, lang] = match;
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) return true;
  try {
    const languages = await publishedLanguages(slug);
    if (!languages) return true;
    return Boolean(lang) && (!languages.includes(lang) || lang === languages[0]);
  } catch {
    return false;
  }
}

export const NOT_FOUND_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>This page does not exist</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fafafa;color:#18181b;text-align:center;padding:1.5rem}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#52525b;max-width:24rem;margin:0 auto 1.5rem;line-height:1.5}a{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:.6rem 1rem;border-radius:.4rem;font-weight:500}@media (prefers-color-scheme:dark){body{background:#09090b;color:#fafafa}p{color:#a1a1aa}}</style></head><body><main><h1>This page does not exist</h1><p>The link may be mistyped, or the portfolio was taken offline by its owner.</p><a href="/">Go to Portfolio Maker</a></main></body></html>`;
