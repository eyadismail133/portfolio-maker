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
  /** The account's other live pages, which count toward the plan's published-page limit. */
  otherLive: { title: string; slug: string | null }[];
};

export async function getPublishState(id: string, current: PortfolioDoc): Promise<PublishState> {
  const { data, error } = await createClient()
    .from("portfolios")
    .select("status, slug, published_at, published_doc, user_id")
    .eq("id", id)
    .single();
  if (error) throw error;
  const row = data as {
    user_id: string;
    status: "draft" | "published";
    slug: string | null;
    published_at: string | null;
    published_doc: unknown;
  };
  // Published pages are readable by everyone, so filter to this account explicitly.
  const others = await createClient()
    .from("portfolios")
    .select("title, slug")
    .eq("user_id", row.user_id)
    .eq("status", "published")
    .neq("id", id);
  return {
    otherLive: (others.data ?? []) as { title: string; slug: string | null }[],
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

/**
 * Publishes this page and takes the account's other live pages offline, in one database step, for
 * accounts at their published-page limit. Returns when it was published.
 */
export async function publishReplacingLive(
  id: string,
  doc: PortfolioDoc,
  slug: string,
  previousSlug: string | null,
): Promise<string> {
  const { data, error } = await createClient().rpc("publish_replacing_live", {
    p_id: id,
    p_slug: slug,
    p_doc: doc,
  });
  if (error) {
    if (error.code === "23505") throw new Error("taken");
    if (/plan_limit_published/.test(error.message)) throw new Error("plan_limit_published");
    throw error;
  }
  const result = data as { published_at: string; offline: string[] };
  await refreshPublicPages([slug, previousSlug, ...(result.offline ?? [])]);
  return result.published_at;
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

/** The newest 200 messages. Locked ones come without their text unless the account is Pro. */
export async function listMessages(): Promise<Message[]> {
  const { data, error } = await createClient().rpc("list_messages", { p_limit: 200 });
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

export type Signup = { id: string; portfolioId: string; email: string; createdAt: string };

/** Addresses left in the newsletter sections of the account's pages, newest first. */
export async function listSignups(): Promise<Signup[]> {
  const { data, error } = await createClient()
    .from("newsletter_signups")
    .select("id, portfolio_id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    portfolioId: String(row.portfolio_id),
    email: String(row.email),
    createdAt: String(row.created_at),
  }));
}

export async function deleteSignup(id: string): Promise<void> {
  const { error } = await createClient().from("newsletter_signups").delete().eq("id", id);
  if (error) throw error;
}

/** A spreadsheet-ready list of sign-ups. Cells that look like formulas are made plain text. */
export function signupsCsv(signups: Signup[], titles: Record<string, string>): string {
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = signups.map((s) =>
    [s.email, titles[s.portfolioId] ?? "", s.createdAt.slice(0, 10)].map(cell).join(","),
  );
  return ["email,page,date", ...rows].join("\r\n");
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

export type PaymentRecord = {
  id: string;
  months: number;
  amountCents: number;
  currency: "EGP" | "USD";
  status: "pending" | "paid" | "failed";
  createdAt: string;
  paidAt: string | null;
};

export async function listPayments(): Promise<PaymentRecord[]> {
  const { data, error } = await createClient()
    .from("payments")
    .select("id, months, amount_cents, currency, status, created_at, paid_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map((p) => ({
    id: String(p.id),
    months: Number(p.months),
    amountCents: Number(p.amount_cents),
    currency: p.currency === "USD" ? "USD" : "EGP",
    status: p.status === "paid" ? "paid" : p.status === "failed" ? "failed" : "pending",
    createdAt: String(p.created_at),
    paidAt: p.paid_at ? String(p.paid_at) : null,
  }));
}
