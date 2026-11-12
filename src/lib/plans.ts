/** What each plan includes. The database (`profiles.plan`) says which plan an account has. */

export type Plan = "free" | "pro";

/** AI requests a Pro account may make per day. The database caps this at 200. */
export const AI_DAILY_LIMIT = 50;

export const PLAN_NAMES: Record<Plan, string> = { free: "Free", pro: "Pro" };

/** Features that depend on the plan. Only `ai` is enforced today; the rest wait for the pricing decision in docs/08. */
export const FEATURES = {
  ai: { free: false, pro: true },
} satisfies Record<string, Record<Plan, boolean>>;

export function hasFeature(plan: Plan | null | undefined, feature: keyof typeof FEATURES): boolean {
  return Boolean(plan && FEATURES[feature][plan]);
}
