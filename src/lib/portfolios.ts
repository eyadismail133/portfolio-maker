import { normalizeDoc } from "@/render-kit/registry";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { createClient } from "@/lib/supabase/client";

/** Reading and writing the signed-in account's portfolios. Runs in the browser; the database's row security does the guarding. */

export type PortfolioSummary = {
  id: string;
  title: string;
  status: "draft" | "published";
  slug: string | null;
  updatedAt: string;
  doc: PortfolioDoc | null;
};

export type LoadedPortfolio = { id: string; title: string; doc: PortfolioDoc; updatedAt: string };

type Row = {
  id: string;
  title: string;
  status: "draft" | "published";
  slug: string | null;
  updated_at: string;
  doc: unknown;
};

const COLUMNS = "id, title, status, slug, updated_at, doc";

function readDoc(raw: unknown): PortfolioDoc | null {
  try {
    return normalizeDoc(raw);
  } catch {
    return null;
  }
}

/** A message a person can act on, whatever went wrong underneath. */
export function friendlyError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message ?? error);
  if (/failed to fetch|network|load failed/i.test(message))
    return "No connection. Check your internet and try again.";
  if (/relation .* does not exist|could not find the table|schema cache/i.test(message)) {
    return "The database is not set up yet. Run supabase/migrations/0001_init.sql in the Supabase SQL editor.";
  }
  if (/row-level security|permission denied|jwt/i.test(message))
    return "You are signed out. Log in again.";
  return message || "Something went wrong. Try again.";
}

export async function listPortfolios(): Promise<PortfolioSummary[]> {
  const { data, error } = await createClient()
    .from("portfolios")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    slug: row.slug,
    updatedAt: row.updated_at,
    doc: readDoc(row.doc),
  }));
}

export async function getPortfolio(id: string): Promise<LoadedPortfolio | null> {
  const { data, error } = await createClient()
    .from("portfolios")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Row;
  return { id: row.id, title: row.title, doc: normalizeDoc(row.doc), updatedAt: row.updated_at };
}

export async function createPortfolio(doc: PortfolioDoc, title: string): Promise<string> {
  const { data, error } = await createClient()
    .from("portfolios")
    .insert({ doc, title: cleanTitle(title) })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export function cleanTitle(title: string): string {
  return title.trim().slice(0, 120) || "Untitled portfolio";
}

/**
 * Saves the document, but only if nobody saved since `knownUpdatedAt`. Returns the new save time,
 * or null when the portfolio was changed somewhere else in the meantime.
 */
export async function savePortfolio(
  id: string,
  change: { doc?: PortfolioDoc; title?: string },
  knownUpdatedAt: string,
): Promise<string | null> {
  const values: Record<string, unknown> = {};
  if (change.doc) values.doc = change.doc;
  if (change.title !== undefined) values.title = cleanTitle(change.title);
  const { data, error } = await createClient()
    .from("portfolios")
    .update(values)
    .eq("id", id)
    .eq("updated_at", knownUpdatedAt)
    .select("updated_at");
  if (error) throw error;
  return (data as { updated_at: string }[])[0]?.updated_at ?? null;
}

export async function renamePortfolio(id: string, title: string): Promise<void> {
  const { error } = await createClient()
    .from("portfolios")
    .update({ title: cleanTitle(title) })
    .eq("id", id);
  if (error) throw error;
}

export async function duplicatePortfolio(source: PortfolioSummary): Promise<string> {
  if (!source.doc) throw new Error("This portfolio cannot be read, so it cannot be copied.");
  return createPortfolio(source.doc, `${source.title} (copy)`);
}

export async function deletePortfolio(id: string): Promise<void> {
  const { error } = await createClient().from("portfolios").delete().eq("id", id);
  if (error) throw error;
}

export async function saveOnboardingAnswers(answers: unknown, portfolioId: string): Promise<void> {
  // Nice to have for later analysis; a failure here must never block the person.
  await createClient().from("onboarding_answers").insert({ answers, portfolio_id: portfolioId });
}

/** True when the failure looks like a missing connection rather than a refused request. */
export function isOffline(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const message =
    error instanceof Error ? error.message : String((error as { message?: string })?.message ?? "");
  return /failed to fetch|network|load failed|fetch failed/i.test(message);
}

/** The plan of the signed-in account, or null when nobody is signed in or it cannot be read. */
export async function getMyPlan(): Promise<"free" | "pro" | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", auth.user.id)
    .maybeSingle();
  return (data as { plan?: string } | null)?.plan === "pro" ? "pro" : "free";
}
