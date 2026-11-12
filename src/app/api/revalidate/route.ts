import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { publishedTag } from "@/lib/published";
import { createClient } from "@/lib/supabase/server";

/** Called after publishing so the public page shows the new version on the next visit. Logged-in accounts only. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { slugs?: unknown } | null;
  const slugs = Array.isArray(body?.slugs)
    ? body.slugs.filter((s): s is string => typeof s === "string").slice(0, 5)
    : [];
  for (const slug of slugs) revalidateTag(publishedTag(slug), { expire: 0 });
  return NextResponse.json({ ok: true });
}
