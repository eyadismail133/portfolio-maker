import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { publishedTag } from "@/lib/published";
import { createClient } from "@/lib/supabase/server";

/**
 * Called after publishing so the public page shows the new version on the next visit. Logged-in
 * accounts only, and only for their own link names or names no other account has live (an old
 * link name after a rename), so nobody can keep emptying the cache of someone else's page.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { slugs?: unknown } | null;
  const asked = Array.isArray(body?.slugs)
    ? body.slugs
        .filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{3,50}$/.test(s))
        .slice(0, 5)
    : [];
  if (asked.length === 0) return NextResponse.json({ ok: true });

  // Row security returns only the caller's own portfolios.
  const { data: mine } = await supabase.from("portfolios").select("slug").in("slug", asked);
  const own = new Set((mine ?? []).map((row) => row.slug as string));
  for (const slug of asked) {
    if (!own.has(slug)) {
      const { data: languages, error } = await supabase.rpc("published_languages", {
        p_slug: slug,
      });
      // Live for another account, or unknown because the database did not answer: leave it.
      if (error || languages !== null) continue;
    }
    revalidateTag(publishedTag(slug), { expire: 0 });
  }
  return NextResponse.json({ ok: true });
}
