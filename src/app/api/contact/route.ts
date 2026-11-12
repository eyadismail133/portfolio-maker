import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** A plain page for visitors whose browser sent the form without the page script. */
function htmlAnswer(ok: boolean, slug: string, status = 200, signup = false) {
  const back = /^[a-z0-9-]{3,50}$/.test(slug) ? `/p/${slug}` : "/";
  const text = ok
    ? signup
      ? "Thank you. You are signed up."
      : "Thank you. Your message was sent."
    : signup
      ? "The sign-up did not go through. Go back and try again."
      : "The message could not be sent. Go back and try again.";
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(text)}</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5"><p>${escape(text)}</p><p><a href="${escape(back)}">Back to the page</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Receives the contact form of a published portfolio and puts the message in its owner's inbox.
 * With `kind=signup` it receives the newsletter form instead and keeps the address.
 */
export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const signup = request.nextUrl.searchParams.get("kind") === "signup";
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
  const answer = (ok: boolean, status = 200) =>
    wantsJson ? NextResponse.json({ ok }, { status }) : htmlAnswer(ok, slug, status, signup);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return answer(false, 400);
  }
  const field = (name: string) => String(form.get(name) ?? "").trim();
  // Spam robots fill in the hidden field; pretend it worked and drop the message.
  if (field("website")) return answer(true);

  if (signup) {
    const address = field("email").slice(0, 200);
    if (!address.includes("@")) return answer(false, 400);
    const { data, error } = await createPublicClient().rpc("submit_newsletter_signup", {
      p_slug: slug,
      p_email: address,
    });
    if (error) return answer(false, 502);
    if (data === "ok") return answer(true);
    return answer(false, data === "busy" ? 429 : data === "not_found" ? 404 : 400);
  }

  const name = field("name").slice(0, 120);
  const email = field("email").slice(0, 200);
  const message = field("message").slice(0, 5000);
  if (!name || !email.includes("@") || !message) return answer(false, 400);

  const { data, error } = await createPublicClient().rpc("submit_contact_message", {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_message: message,
  });
  if (error) return answer(false, 502);
  if (data === "ok") return answer(true);
  return answer(false, data === "busy" ? 429 : data === "not_found" ? 404 : 400);
}
