import { accountEmail, sendEmail } from "@/lib/email";
import { formatPrice, type Currency } from "@/lib/plans";
import { siteUrl } from "@/lib/site";
import { receiptNumber } from "./receipt-number";

/** Emails the receipt for a paid payment. Called after Paymob confirms it; never throws. */
export async function sendReceipt(paymentId: string): Promise<void> {
  if (!process.env.SUPABASE_SECRET_KEY) return;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: payment } = await admin
      .from("payments")
      .select("id, user_id, months, amount_cents, currency, status, paid_at")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment || payment.status !== "paid") return;
    const { data: profile } = await admin
      .from("profiles")
      .select("pro_until")
      .eq("id", payment.user_id)
      .maybeSingle();
    const to = await accountEmail(String(payment.user_id));
    if (!to) return;
    const until = profile?.pro_until
      ? new Date(profile.pro_until).toLocaleDateString("en-GB", { dateStyle: "long" })
      : null;
    await sendEmail({
      to,
      subject: `Receipt ${receiptNumber(payment.id)}: Portfolio Maker Pro`,
      paragraphs: [
        `Thank you. We received ${formatPrice(Number(payment.amount_cents), payment.currency as Currency)} for ${payment.months} month(s) of Pro.`,
        until
          ? `Pro now runs until ${until}. It does not renew by itself.`
          : "Pro is active on your account.",
        `Receipt number: ${receiptNumber(payment.id)}`,
      ],
      action: { label: "View the receipt", href: `${siteUrl()}/account/receipt/${payment.id}` },
    });
  } catch {
    // The payment is already applied; a missing email only means the receipt is on the account page.
  }
}
