import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const ROBOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i;
/** One browser counts as one visit per page for this long, however often it reloads. */
const VISIT_WINDOW_SECONDS = 30 * 60;

/**
 * Counts one visit to a published portfolio. Robots and link previews are not counted, and a
 * browser that was counted for this page in the last 30 minutes is not counted again (a small
 * cookie only this address reads). Robots that drop cookies can still add visits, but the
 * database spreads them over 16 rows, so they cannot slow it down.
 */
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const response = new NextResponse(null, { status: 204 });
  if (!/^[a-z0-9-]{3,50}$/.test(slug) || ROBOTS.test(request.headers.get("user-agent") ?? ""))
    return response;
  const cookie = `pk_v_${slug}`;
  if (request.cookies.has(cookie)) return response;
  await createPublicClient().rpc("record_page_view", { p_slug: slug });
  response.cookies.set(cookie, "1", {
    maxAge: VISIT_WINDOW_SECONDS,
    path: "/api/view",
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
