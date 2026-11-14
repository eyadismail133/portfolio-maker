import { NextResponse, type NextRequest } from "next/server";
import { accountEmail, emailEnabled, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * Runs once a day (vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`; any other
 * caller is refused.
 * - Reminds Pro accounts whose prepaid months end in 3 days (the window is one day wide, so a
 *   daily run reminds each account once).
 * - Removes server errors older than 30 days from the error log.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ ok: false }, { status: 401 });
  if (!process.env.SUPABASE_SECRET_KEY) return NextResponse.json({ ok: false, reason: "setup" });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const day = 24 * 3600 * 1000;
  const now = Date.now();

  let reminded = 0;
  if (emailEnabled()) {
    const { data: ending } = await admin
      .from("profiles")
      .select("id, pro_until")
      .eq("plan", "pro")
      .gte("pro_until", new Date(now + 3 * day).toISOString())
      .lt("pro_until", new Date(now + 4 * day).toISOString())
      .limit(500);
    const remind = async (profile: { id: string; pro_until: string }) => {
      const to = await accountEmail(String(profile.id));
      if (!to) return false;
      const until = new Date(profile.pro_until).toLocaleDateString("en-GB", { dateStyle: "long" });
      return sendEmail({
        to,
        subject: "Your Pro months end in 3 days",
        paragraphs: [
          `Your Portfolio Maker Pro ends on ${until}. It does not renew by itself.`,
          "After that your account is Free again. Nothing is deleted and your published pages stay online. The badge comes back, AI, HTML downloads, the PDF CV and custom domains stop, and new pages follow the Free limits.",
          "To keep Pro, add more months before that date; they start when the current ones end.",
        ],
        action: { label: "Add Pro months", href: `${siteUrl()}/pro` },
      });
    };
    // Ten at a time: one by one, 500 accounts would take minutes; all at once would flood the
    // auth and email services.
    const list = (ending ?? []) as { id: string; pro_until: string }[];
    for (let i = 0; i < list.length; i += 10) {
      const sent = await Promise.all(list.slice(i, i + 10).map(remind));
      reminded += sent.filter(Boolean).length;
    }
  }

  await admin
    .from("error_log")
    .delete()
    .lt("created_at", new Date(now - 30 * day).toISOString());

  return NextResponse.json({ ok: true, reminded });
}
