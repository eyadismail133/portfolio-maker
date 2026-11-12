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
