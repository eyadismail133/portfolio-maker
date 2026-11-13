/**
 * Details about the business behind the site, shown on the legal pages. Set them in the
 * environment (and in Vercel); until then the pages show clearly marked blanks.
 */
export const SITE = {
  name: "Portfolio Maker",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "[business name]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[contact email]",
  country: "Egypt",
  /** Date the current terms, privacy and refund texts took effect. Change it when the texts change. */
  policiesUpdated: "13 November 2026",
};

/**
 * The public address of the app, for links in emails. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
 * by itself; NEXT_PUBLIC_SITE_URL wins when a custom address is in use.
 */
export function siteUrl(): string {
  const own = process.env.NEXT_PUBLIC_SITE_URL;
  if (own) return own.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
