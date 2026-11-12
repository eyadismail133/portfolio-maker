import type { Lang } from "@/render-kit/schema/primitives";

export const WHO = [
  "professional",
  "student",
  "freelancer",
  "creative",
  "company",
  "agency",
  "startup",
  "other",
] as const;
export type Who = (typeof WHO)[number];

export const GOALS = ["hired", "clients", "investors", "signups", "showcase"] as const;
export type Goal = (typeof GOALS)[number];

export const STYLES = [
  "minimal",
  "bold",
  "elegant",
  "playful",
  "tech",
  "editorial",
  "corporate",
  "creative",
] as const;
export type StyleId = (typeof STYLES)[number];

export const ASSETS = [
  "photos",
  "projectImages",
  "logo",
  "testimonials",
  "cv",
  "video",
  "clientLogos",
  "numbers",
] as const;
export type AssetKind = (typeof ASSETS)[number];

/** What a person told us in the onboarding questions. Every answer can be skipped. */
export type Answers = {
  who: Who | null;
  /** Id of a field in content.ts, such as "software". */
  field: string | null;
  goal: Goal | null;
  /** Up to two styles. */
  styles: StyleId[];
  /** Id of a ready palette, or null. */
  palette: string | null;
  /** A brand color like #1f4fd8. Wins over `palette`. */
  brandColor: string | null;
  mode: "light" | "dark" | "both" | null;
  assets: AssetKind[];
  languages: Lang[];
  name: string;
  title: string;
};

export const EMPTY_ANSWERS: Answers = {
  who: null,
  field: null,
  goal: null,
  styles: [],
  palette: null,
  brandColor: null,
  mode: null,
  assets: [],
  languages: ["en"],
  name: "",
  title: "",
};

/** True for answers about an organisation rather than one person. */
export function isOrganisation(who: Who | null): boolean {
  return who === "company" || who === "agency" || who === "startup";
}
