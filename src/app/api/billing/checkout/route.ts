import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createCheckout, paymobConfig } from "@/lib/billing/paymob";
import { CURRENCIES, MONTH_OPTIONS, priceFor, type Months } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  months: z.number().refine((n): n is Months => (MONTH_OPTIONS as readonly number[]).includes(n)),
  currency: z.enum(CURRENCIES),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Starts buying Pro. The price comes from the server, never from the browser. */
export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("invalid", 400);
  const { months, currency } = parsed.data;

  const config = paymobConfig();
  if (!config.currencies.includes(currency)) return fail("setup", 503);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) return fail("login", 401);

  const admin = createAdminClient();
  const amountCents = priceFor(months as Months, currency);
  const { data: payment, error } = await admin
    .from("payments")
    .insert({ user_id: user.id, months, amount_cents: amountCents, currency })
    .select("id")
    .single();
  if (error || !payment) return fail("database", 502);

  const origin = request.nextUrl.origin;
  try {
    const { url, orderId } = await createCheckout({
      paymentId: payment.id,
      amountCents,
      currency,
      itemName: `Portfolio Maker Pro, ${months} month${months > 1 ? "s" : ""}`,
      email: user.email,
      name: String(user.user_metadata?.full_name ?? ""),
      notificationUrl: `${origin}/api/billing/paymob`,
      redirectionUrl: `${origin}/pro/done?payment=${payment.id}`,
    });
    if (orderId)
      await admin.from("payments").update({ provider_order_id: orderId }).eq("id", payment.id);
    return NextResponse.json({ url });
  } catch {
    await admin.rpc("mark_payment_failed", { p_payment_id: payment.id });
    return fail("provider", 502);
  }
}
