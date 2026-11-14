import type { SupabaseClient } from "@supabase/supabase-js";
import { isAppHost, slugForDomain } from "@/lib/custom-domain";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Spam protection for what visitors send (contact messages, newsletter sign-ups, reports), with
 * Cloudflare Turnstile. It is on when both keys are set; without them every form works as before.
 *
 * Turnstile's free plan only works on the hostnames listed in Cloudflare, so pages on owners'
 * custom domains get no check. A request on a custom domain may only send to the page that
 * domain shows, so the domain cannot be used to skip the check for other pages.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The public site key for the widget, or null when the check is off. */
export function turnstileSiteKey(): string | null {
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return site && process.env.TURNSTILE_SECRET_KEY ? site : null;
}

/** Asks Cloudflare whether the widget's token is genuine. Always true while the check is off. */
export async function passesTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSiteKey() || !secret) return true;
  if (!token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

function visitorIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/** True when this visitor may send something to the page with this link name. */
export async function visitorMaySend(
  request: Request,
  slug: string,
  token: string,
): Promise<boolean> {
  const host = request.headers.get("host") ?? "";
  if (host && !isAppHost(host)) return (await slugForDomain(host)) === slug;
  return passesTurnstile(token, visitorIp(request));
}

/**
 * The database client for visitor forms. The form functions are for the server key only
 * (`0010`), so visitors cannot call them directly and skip the check. Without the server key
 * (a setup before `0010`) the public key is used.
 */
export async function formClient(): Promise<SupabaseClient> {
  if (!process.env.SUPABASE_SECRET_KEY) return createPublicClient();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return createAdminClient();
}
