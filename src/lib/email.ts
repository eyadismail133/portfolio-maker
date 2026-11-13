import { siteUrl, SITE } from "@/lib/site";

/**
 * Emails through Resend (resend.com, free for 3,000 emails a month). Server only. Without
 * RESEND_API_KEY and EMAIL_FROM nothing is sent and nothing fails.
 */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export type Email = {
  to: string;
  subject: string;
  /** Plain paragraphs. They are escaped, so user text is safe here. */
  paragraphs: string[];
  /** One button under the text. */
  action?: { label: string; href: string };
};

/** The same message as simple HTML and as plain text. */
export function renderEmail(email: Email): { html: string; text: string } {
  const body = email.paragraphs
    .map((p) => `<p style="margin:0 0 14px;white-space:pre-line">${escape(p)}</p>`)
    .join("");
  const button = email.action
    ? `<p style="margin:22px 0"><a href="${escape(email.action.href)}" style="background:#1f4fd8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${escape(email.action.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5"><div style="max-width:560px;margin:0 auto;padding:28px 20px;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b"><p style="margin:0 0 20px;font-weight:700">${SITE.name}</p>${body}${button}<p style="margin:28px 0 0;font-size:12px;color:#71717a">${escape(SITE.name)} · <a href="${siteUrl()}/account" style="color:#71717a">Your account</a></p></div></body></html>`;
  const text = [
    ...email.paragraphs,
    ...(email.action ? [`${email.action.label}: ${email.action.href}`] : []),
    `— ${SITE.name}`,
  ].join("\n\n");
  return { html, text };
}

/** Sends one email. Returns false (and never throws) when sending is off or fails. */
export async function sendEmail(email: Email): Promise<boolean> {
  if (!emailEnabled() || !email.to.includes("@")) return false;
  const { html, text } = renderEmail(email);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** The email address of an account, read with the server key. Null when it cannot be read. */
export async function accountEmail(userId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data } = await createAdminClient().auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}
