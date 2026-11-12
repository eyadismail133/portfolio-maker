import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const ROBOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i;

/** Counts one visit to a published portfolio. Robots and link previews are not counted. */
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (/^[a-z0-9-]{3,50}$/.test(slug) && !ROBOTS.test(request.headers.get("user-agent") ?? "")) {
    await createPublicClient().rpc("record_page_view", { p_slug: slug });
  }
  return new NextResponse(null, { status: 204 });
}
