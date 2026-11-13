import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { domainProblem, normaliseDomain } from "@/lib/custom-domain";
import { createClient } from "@/lib/supabase/server";
import { addDomain, domainStatus, removeDomain, vercelEnabled } from "@/lib/vercel-domains";

/**
 * Custom domains for Pro. The database decides who may add one (Pro, own page); this route also
 * connects the domain to the Vercel project and, once its DNS is right, marks it verified with
 * the server key.
 */
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

async function markVerified(domain: string, verified: boolean) {
  if (!process.env.SUPABASE_SECRET_KEY) return;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  await createAdminClient().from("custom_domains").update({ verified }).eq("domain", domain);
}

/** The domain of one page, with the DNS records to add and whether it works yet. */
export async function GET(request: NextRequest) {
  const supabase = await signedIn();
  if (!supabase) return fail("login", 401);
  const portfolioId = request.nextUrl.searchParams.get("portfolioId") ?? "";
  const { data, error } = await supabase
    .from("custom_domains")
    .select("domain, verified")
    .eq("portfolio_id", portfolioId)
    .maybeSingle();
  if (error) return fail("setup", 503);
  if (!data) return NextResponse.json({ domain: null, enabled: vercelEnabled() });
  if (!vercelEnabled())
    return NextResponse.json({
      domain: data.domain,
      ready: data.verified,
      records: [],
      enabled: false,
    });
  const status = await domainStatus(data.domain);
  if (status.ready !== data.verified) await markVerified(data.domain, status.ready);
  return NextResponse.json({ domain: data.domain, ...status, enabled: true });
}

const addSchema = z.object({ portfolioId: z.string().uuid(), domain: z.string().max(253) });

export async function POST(request: NextRequest) {
  const supabase = await signedIn();
  if (!supabase) return fail("login", 401);
  if (!vercelEnabled()) return fail("Custom domains are not switched on for this site yet.", 503);
  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Enter a domain like portfolio.example.com.", 400);
  const domain = normaliseDomain(parsed.data.domain);
  const problem = domainProblem(domain);
  if (problem) return fail(problem, 400);

  const { error } = await supabase
    .from("custom_domains")
    .insert({ domain, portfolio_id: parsed.data.portfolioId });
  if (error) {
    if (error.code === "23505")
      return fail("This domain, or a domain for this page, is already connected.", 409);
    if (error.code === "42501" || /row-level security/i.test(error.message))
      return fail("Custom domains are part of Pro, for your own published pages.", 403);
    return fail("Custom domains are not set up yet (database step 0006).", 503);
  }
  const added = await addDomain(domain);
  if (!added.ok) {
    await supabase.from("custom_domains").delete().eq("domain", domain);
    return fail(added.reason, 400);
  }
  const status = await domainStatus(domain);
  if (status.ready) await markVerified(domain, true);
  return NextResponse.json({ domain, ...status, enabled: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await signedIn();
  if (!supabase) return fail("login", 401);
  const portfolioId = request.nextUrl.searchParams.get("portfolioId") ?? "";
  const { data } = await supabase
    .from("custom_domains")
    .delete()
    .eq("portfolio_id", portfolioId)
    .select("domain")
    .maybeSingle();
  if (data?.domain && vercelEnabled()) await removeDomain(data.domain);
  return NextResponse.json({ ok: true });
}
