import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/supabase/proxy";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase sends people back after Google sign-in and after clicking a link in an email
 * (confirm address, reset password). Swaps the one-time code for a session, then moves on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
  }
  return NextResponse.redirect(`${origin}/login?problem=link`);
}
