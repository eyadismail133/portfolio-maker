/**
 * What each plan includes and what Pro costs. The database enforces the same limits
 * (supabase/migrations/0004_plans_and_billing.sql); a test checks the two agree.
 */

export type Plan = "free" | "pro";

export const PLAN_NAMES: Record<Plan, string> = { free: "Free", pro: "Pro" };

/** AI requests a Pro account may make per day. The database caps this at 200. */
export const AI_DAILY_LIMIT = 50;

export const LIMITS = {
  portfolios: { free: 3, pro: Infinity },
  published: { free: 1, pro: 10 },
  storageBytes: { free: 50 * 1024 * 1024, pro: 2 * 1024 * 1024 * 1024 },
  versions: { free: 5, pro: 30 },
  messagesPerMonth: { free: 50, pro: Infinity },
} as const;

export const FEATURES = {
  ai: { free: false, pro: true },
  downloadHtml: { free: false, pro: true },
  noBadge: { free: false, pro: true },
  pdfCv: { free: false, pro: true },
  cvImport: { free: false, pro: true },
} satisfies Record<string, Record<Plan, boolean>>;

export function hasFeature(plan: Plan | null | undefined, feature: keyof typeof FEATURES): boolean {
  return Boolean(plan && FEATURES[feature][plan]);
}

/** Pro is bought as prepaid months. Prices are per month, in the smallest unit (piastres, cents). */
export const MONTH_OPTIONS = [1, 3, 6, 12] as const;
export type Months = (typeof MONTH_OPTIONS)[number];
export const CURRENCIES = ["EGP", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const MONTHLY_PRICE: Record<Currency, number> = { EGP: 250_00, USD: 6_00 };

export function priceFor(months: Months, currency: Currency): number {
  return MONTHLY_PRICE[currency] * months;
}

export function formatPrice(cents: number, currency: Currency): string {
  const amount = cents / 100;
  return currency === "EGP"
    ? `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} EGP`
    : `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** The plan in force: a "pro" plan whose prepaid months have run out counts as free. */
export function effectivePlan(
  plan: string | null | undefined,
  proUntil: string | null | undefined,
  now = Date.now(),
): Plan {
  if (plan !== "pro") return "free";
  return !proUntil || new Date(proUntil).getTime() > now ? "pro" : "free";
}

/** The rows of the Free / Pro table on the Go Pro page. */
export const COMPARISON: { label: string; free: string; pro: string }[] = [
  { label: "Portfolios", free: "3", pro: "Unlimited" },
  { label: "Published pages", free: "1", pro: "10" },
  { label: "All designs, sections and palettes", free: "Yes", pro: "Yes" },
  { label: "Arabic and English", free: "Yes", pro: "Yes" },
  { label: '"Made with Portfolio Maker" badge', free: "Shown", pro: "Removed" },
  { label: "Image storage", free: "50 MB", pro: "2 GB" },
  { label: "Contact form messages", free: "50 a month", pro: "Unlimited" },
  { label: "Visits", free: "Last 30 days", pro: "Last 30 days" },
  { label: "Version history", free: "Last 5", pro: "Last 30" },
  { label: "Download as HTML", free: "No", pro: "Yes" },
  { label: "AI writing", free: "No", pro: "50 uses a day" },
  { label: "PDF CV from your portfolio", free: "No", pro: "Yes" },
  { label: "Fill from a CV or LinkedIn PDF", free: "No", pro: "Yes" },
];
