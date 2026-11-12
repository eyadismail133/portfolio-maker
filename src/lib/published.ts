import { cacheLife, cacheTag } from "next/cache";
import { normalizeDoc } from "@/render-kit/registry";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { createPublicClient } from "@/lib/supabase/public";

export type Published = { title: string; doc: PortfolioDoc; publishedAt: string };

export const publishedTag = (slug: string) => `published:${slug}`;

/** The public version of a portfolio, or null. Cached for a few minutes and refreshed on publish. */
export async function getPublished(slug: string): Promise<Published | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(publishedTag(slug));
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) return null;
  const { data, error } = await createPublicClient().rpc("get_published_portfolio", {
    p_slug: slug,
  });
  if (error) throw new Error(error.message);
  const row = (data as { title: string; doc: unknown; published_at: string }[] | null)?.[0];
  if (!row) return null;
  try {
    return { title: row.title, doc: normalizeDoc(row.doc), publishedAt: row.published_at };
  } catch {
    return null;
  }
}
