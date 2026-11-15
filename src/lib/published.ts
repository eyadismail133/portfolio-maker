import { cacheLife, cacheTag } from "next/cache";
import { normalizeDoc } from "@/render-kit/registry";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { createPublicClient } from "@/lib/supabase/public";

export type Published = {
  title: string;
  doc: PortfolioDoc;
  publishedAt: string;
  showBadge: boolean;
};

export const publishedTag = (slug: string) => `published:${slug}`;

/**
 * The public version of a portfolio, or null. Kept in the host's shared cache for hours and
 * cleared on publish.
 *
 * "use cache: remote", not plain "use cache": on Vercel the plain one keeps nothing that is worked
 * out while a request runs (load test, 15 November 2026: one database call per page view), while
 * the remote one is Vercel's Runtime Cache, shared by every server copy. Hobby includes 1M read
 * units of 8 KB a month; this entry is small (a page's document, usually 10–50 KB). Past the
 * allowance Vercel pauses the cache without charging and pages read the database again.
 */
export async function getPublished(slug: string): Promise<Published | null> {
  "use cache: remote";
  // Kept for hours: publishing, unpublishing and replacing clear the tag at once, and a page taken
  // offline any other way gets a 404 from the proxy's own check within a minute.
  cacheLife("hours");
  cacheTag(publishedTag(slug));
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) return null;
  const { data, error } = await createPublicClient().rpc("get_published_portfolio", {
    p_slug: slug,
  });
  if (error) throw new Error(error.message);
  const row = (
    data as { title: string; doc: unknown; published_at: string; show_badge?: boolean }[] | null
  )?.[0];
  if (!row) return null;
  try {
    return {
      title: row.title,
      doc: normalizeDoc(row.doc),
      publishedAt: row.published_at,
      showBadge: row.show_badge !== false,
    };
  } catch {
    return null;
  }
}
