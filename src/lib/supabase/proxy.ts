import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { domainPath, isAppHost, slugForDomain } from "@/lib/custom-domain";
import { isMissingPublishedPage, NOT_FOUND_HTML } from "@/lib/published-check";

/** Pages that need a signed-in account. `/editor` alone stays open: it edits a draft in the browser. */
export function needsAccount(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/editor/") ||
    pathname === "/pro/done" ||
    pathname === "/account" ||
    pathname.startsWith("/account/")
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
  // A custom domain shows one published page and nothing of the app.
  const host = request.headers.get("host") ?? "";
  if (host && !isAppHost(host)) {
    const slug = await slugForDomain(host);
    if (slug) {
      const path = domainPath(request.nextUrl.pathname, slug);
      if (path === null)
        return new NextResponse(NOT_FOUND_HTML, {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      if (path !== "pass") {
        const target = request.nextUrl.clone();
        target.pathname = path;
        return NextResponse.rewrite(target);
      }
      return NextResponse.next({ request });
    }
  }

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
  if (pathname.startsWith("/p/") && (await isMissingPublishedPage(pathname))) {
    return new NextResponse(NOT_FOUND_HTML, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
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
