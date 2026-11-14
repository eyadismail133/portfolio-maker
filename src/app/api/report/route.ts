import { NextResponse, type NextRequest } from "next/server";
import { formClient, visitorMaySend } from "@/lib/visitor-check";

/** Stores a visitor's report about a published page for the site owner to review. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = (key: string, max: number) =>
    String(body?.[key] ?? "")
      .trim()
      .slice(0, max);
  // Spam robots fill in the hidden field; pretend it worked.
  if (text("website", 200)) return NextResponse.json({ ok: true });
  const slug = text("slug", 50);
  if (!(await visitorMaySend(request, slug, text("turnstile", 2048))))
    return NextResponse.json({ ok: false, error: "check" }, { status: 403 });
  const { data, error } = await (
    await formClient()
  ).rpc("submit_abuse_report", {
    p_slug: slug,
    p_reason: text("reason", 20),
    p_details: text("details", 2000),
    p_email: text("email", 200),
  });
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 502 });
  if (data !== "ok")
    return NextResponse.json({ ok: false, error: data }, { status: data === "busy" ? 429 : 400 });
  return NextResponse.json({ ok: true });
}
