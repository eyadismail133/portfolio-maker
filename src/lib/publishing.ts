import type { PortfolioDoc } from "@/render-kit/schema/document";
import { normalizeDoc } from "@/render-kit/registry";
import { createClient } from "@/lib/supabase/client";

/** Publishing, version history and the inbox. Runs in the browser; row security guards the data. */

export type PublishState = {
  status: "draft" | "published";
  slug: string | null;
  publishedAt: string | null;
  /** True when the editor has changes that visitors do not see yet. */
  changedSincePublish: boolean;
};

export async function getPublishState(id: string, current: PortfolioDoc): Promise<PublishState> {
  const { data, error } = await createClient()
    .from("portfolios")
    .select("status, slug, published_at, published_doc")
    .eq("id", id)
    .single();
  if (error) throw error;
  const row = data as {
    status: "draft" | "published";
    slug: string | null;
    published_at: string | null;
    published_doc: unknown;
  };
  return {
    status: row.status,
    slug: row.slug,
    publishedAt: row.published_at,
    changedSincePublish:
      row.status === "published" && JSON.stringify(row.published_doc) !== JSON.stringify(current),
  };
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("is_slug_available", { p_slug: slug });
  if (error) throw error;
  return data === true;
}

/** Tells the site to show the newest version of these published pages right away. */
async function refreshPublicPages(slugs: (string | null | undefined)[]) {
  const unique = [...new Set(slugs.filter((s): s is string => Boolean(s)))];
  if (unique.length === 0) return;
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slugs: unique }),
    });
  } catch {
    // The page refreshes by itself within a few minutes anyway.
  }
}

/**
 * Makes the document the public version at /p/<slug> and keeps a copy in the version history.
 * Throws "taken" when another account already uses the link name.
 */
export async function publish(
  id: string,
  doc: PortfolioDoc,
  slug: string,
  previousSlug: string | null,
): Promise<string> {
  const supabase = createClient();
  const publishedAt = new Date().toISOString();
  const { error } = await supabase
    .from("portfolios")
    .update({ slug, published_doc: doc, status: "published", published_at: publishedAt })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("taken");
    if (/plan_limit_published/.test(error.message)) throw new Error("plan_limit_published");
    throw error;
  }
  await supabase.from("portfolio_versions").insert({ portfolio_id: id, doc, label: "Published" });
  await refreshPublicPages([slug, previousSlug]);
  return publishedAt;
}

/** Takes the page offline. The link name stays reserved for this portfolio. */
export async function unpublish(id: string, slug: string | null): Promise<void> {
  const { error } = await createClient()
    .from("portfolios")
    .update({ status: "draft", published_doc: null })
    .eq("id", id);
  if (error) throw error;
  await refreshPublicPages([slug]);
}

export type Version = { id: string; label: string; createdAt: string };

export async function listVersions(portfolioId: string): Promise<Version[]> {
  const { data, error } = await createClient()
    .from("portfolio_versions")
    .select("id, label, created_at")
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as { id: string; label: string; created_at: string }[]).map((v) => ({
    id: v.id,
    label: v.label,
    createdAt: v.created_at,
  }));
}

export async function saveVersion(
  portfolioId: string,
  doc: PortfolioDoc,
  label: string,
): Promise<void> {
  const { error } = await createClient()
    .from("portfolio_versions")
    .insert({ portfolio_id: portfolioId, doc, label: label.trim().slice(0, 80) });
  if (error) throw error;
}

export async function loadVersion(versionId: string): Promise<PortfolioDoc> {
  const { data, error } = await createClient()
    .from("portfolio_versions")
    .select("doc")
    .eq("id", versionId)
    .single();
  if (error) throw error;
  return normalizeDoc((data as { doc: unknown }).doc);
}

export type Message = {
  id: string;
  /** Arrived after the free monthly 50; readable after going Pro. */
  locked: boolean;
  portfolioId: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export async function listMessages(): Promise<Message[]> {
  const { data, error } = await createClient()
    .from("form_submissions")
    .select("id, portfolio_id, name, email, message, is_read, locked, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    locked: m.locked === true,
    portfolioId: String(m.portfolio_id),
    name: String(m.name),
    email: String(m.email),
    message: String(m.message),
    isRead: Boolean(m.is_read),
    createdAt: String(m.created_at),
  }));
}

export async function setMessageRead(id: string, isRead: boolean): Promise<void> {
  const { error } = await createClient()
    .from("form_submissions")
    .update({ is_read: isRead })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await createClient().from("form_submissions").delete().eq("id", id);
  if (error) throw error;
}

/** Visits per portfolio over the last 30 days. */
export async function viewCounts(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data, error } = await createClient()
    .from("page_views")
    .select("portfolio_id, views")
    .gte("day", since);
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const row of data as { portfolio_id: string; views: number }[]) {
    totals[row.portfolio_id] = (totals[row.portfolio_id] ?? 0) + row.views;
  }
  return totals;
}
