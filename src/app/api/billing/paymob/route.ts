import { NextResponse, type NextRequest } from "next/server";
import { isGenuineCallback, paymobConfig, readOutcome } from "@/lib/billing/paymob";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Paymob calls this after every payment ("transaction processed" callback). Only a callback with a
 * correct HMAC signature can give an account Pro, and only for the exact amount that was ordered.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    obj?: Record<string, unknown>;
  } | null;
  const obj = body?.obj;
  if (!obj) return NextResponse.json({ ok: false }, { status: 400 });

  const hmac = request.nextUrl.searchParams.get("hmac") ?? "";
  if (!isGenuineCallback(obj, hmac, paymobConfig().hmacSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const outcome = readOutcome(obj);
  if (!/^[0-9a-f-]{36}$/i.test(outcome.paymentId))
    return NextResponse.json({ ok: true, ignored: "reference" });

  const admin = createAdminClient();
  if (outcome.state === "paid") {
    const { data, error } = await admin.rpc("apply_paid_payment", {
      p_payment_id: outcome.paymentId,
      p_transaction_id: outcome.transactionId,
      p_amount_cents: outcome.amountCents,
      p_currency: outcome.currency,
    });
    // An error makes Paymob try the callback again later.
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, result: data });
  }
  if (outcome.state === "failed")
    await admin.rpc("mark_payment_failed", { p_payment_id: outcome.paymentId });
  return NextResponse.json({ ok: true, result: outcome.state });
}
