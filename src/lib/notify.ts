import { accountEmail, emailEnabled, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

/**
 * Tells a page owner by email that a message arrived. The message itself stays in the inbox
 * (it may be locked on Free). At most one email per page every 10 minutes, so a burst of
 * messages sends one email.
 */
export async function notifyNewMessage(slug: string): Promise<void> {
  if (!emailEnabled() || !process.env.SUPABASE_SECRET_KEY) return;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: page } = await admin
      .from("portfolios")
      .select("id, user_id, title")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    if (!page) return;
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("portfolio_id", page.id)
      .gte("created_at", since);
    if ((count ?? 0) > 1) return;
    const to = await accountEmail(String(page.user_id));
    if (!to) return;
    await sendEmail({
      to,
      subject: `New message on ${page.title || slug}`,
      paragraphs: [
        `Someone sent you a message through the contact form on ${page.title || slug}.`,
        "Read it and reply from your inbox.",
      ],
      action: { label: "Open my inbox", href: `${siteUrl()}/dashboard/inbox` },
    });
  } catch {
    // An email that cannot be sent never affects the message, which is already saved.
  }
}
