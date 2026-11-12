import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Pages that need a signed-in account. `/editor` alone stays open: it edits a draft in the browser. */
export function needsAccount(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/editor/") ||
    pathname === "/pro/done"
  );
}

const AUTH_PAGES = new Set(["/login", "/signup", "/forgot-password"]);

/** Only allows going to a page of this site after login, never to another site. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : fallback;
}

/**
 * Refreshes the Supabase login session on each request, sends visitors without an account away
 * from private pages, and sends signed-in visitors away from the login pages.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not add code between creating the client and this call: it is what refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;
  const redirect = (to: string) => {
    const result = NextResponse.redirect(new URL(to, request.url));
    // Keep any refreshed session cookies on the redirect.
    for (const cookie of response.cookies.getAll()) result.cookies.set(cookie);
    return result;
  };

  if (!signedIn && needsAccount(pathname)) {
    return redirect(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  if (signedIn && AUTH_PAGES.has(pathname)) {
    return redirect(safeNext(request.nextUrl.searchParams.get("next")));
  }
  return response;
}
