import { isOrganisation, type Answers, type AssetKind, type Goal, type Who } from "./types";

/** Which sections a portfolio starts with, by who it is for and what it should achieve. */

const PERSON: Record<Goal, string[]> = {
  hired: [
    "navbar",
    "hero",
    "about",
    "work-experience",
    "projects",
    "skills",
    "education",
    "languages",
    "certificates",
    "testimonials",
    "contact",
    "footer",
  ],
  clients: [
    "navbar",
    "hero",
    "services",
    "projects",
    "how-it-works",
    "testimonials",
    "pricing",
    "faq",
    "cta",
    "contact",
    "footer",
  ],
  showcase: [
    "navbar",
    "hero",
    "gallery",
    "projects",
    "about",
    "awards",
    "testimonials",
    "social-links",
    "contact",
    "footer",
  ],
  investors: [
    "navbar",
    "hero",
    "about",
    "projects",
    "stats",
    "work-experience",
    "testimonials",
    "contact",
    "footer",
  ],
  signups: [
    "navbar",
    "hero",
    "about",
    "services",
    "testimonials",
    "faq",
    "newsletter",
    "contact",
    "footer",
  ],
};

const STUDENT = [
  "navbar",
  "hero",
  "about",
  "education",
  "projects",
  "skills",
  "languages",
  "certificates",
  "interests",
  "contact",
  "footer",
];

const COMPANY: Record<Goal, string[]> = {
  clients: [
    "navbar",
    "hero",
    "logo-strip",
    "services",
    "stats",
    "case-study",
    "how-it-works",
    "team",
    "testimonials",
    "faq",
    "cta",
    "contact",
    "map",
    "footer",
  ],
  hired: [
    "navbar",
    "hero",
    "mission-values",
    "services",
    "team",
    "stats",
    "testimonials",
    "cta",
    "contact",
    "footer",
  ],
  showcase: [
    "navbar",
    "hero",
    "logo-strip",
    "projects",
    "case-study",
    "services",
    "team",
    "testimonials",
    "contact",
    "footer",
  ],
  investors: [
    "navbar",
    "hero",
    "problem-solution",
    "features",
    "stats",
    "timeline",
    "team",
    "press",
    "partners",
    "cta",
    "footer",
  ],
  signups: [
    "navbar",
    "hero",
    "features",
    "how-it-works",
    "stats",
    "testimonials",
    "pricing",
    "faq",
    "newsletter",
    "footer",
  ],
};

const DEFAULT_GOAL: Record<Who, Goal> = {
  professional: "hired",
  student: "hired",
  freelancer: "clients",
  creative: "showcase",
  company: "clients",
  agency: "clients",
  startup: "signups",
  other: "showcase",
};

function insertBefore(list: string[], type: string, anchors: string[]) {
  if (list.includes(type)) return;
  const index = list.findIndex((t) => anchors.includes(t));
  list.splice(index === -1 ? list.length - 1 : index, 0, type);
}

function insertAfter(list: string[], type: string, anchor: string) {
  if (list.includes(type)) return;
  const index = list.indexOf(anchor);
  list.splice(index === -1 ? 1 : index + 1, 0, type);
}

export type Recipe = {
  /** Section types in page order. */
  sections: string[];
  /** Sections that are on the page but switched off, ready to turn on later. */
  hidden: string[];
};

/** The section list for a set of answers, adjusted to the material the person has ready. */
export function recipeFor(answers: Pick<Answers, "who" | "goal" | "assets">): Recipe {
  const who = answers.who ?? "professional";
  const goal = answers.goal ?? DEFAULT_GOAL[who];
  const organisation = isOrganisation(who);
  const base = organisation
    ? COMPANY[goal]
    : who === "student" && goal === "hired"
      ? STUDENT
      : PERSON[goal];
  const sections = [...base];
  const has = (kind: AssetKind) => answers.assets.includes(kind);
  const hidden: string[] = [];

  if (has("video"))
    insertBefore(sections, "video", [
      "testimonials",
      "pricing",
      "faq",
      "cta",
      "newsletter",
      "contact",
      "footer",
    ]);
  if (has("clientLogos")) insertAfter(sections, "logo-strip", "hero");
  else if (sections.includes("logo-strip")) hidden.push("logo-strip");
  if (has("numbers"))
    insertBefore(sections, "stats", ["testimonials", "team", "faq", "cta", "contact", "footer"]);
  else if (sections.includes("stats")) hidden.push("stats");
  if (has("cv") && !organisation) insertBefore(sections, "cv-download", ["contact", "footer"]);
  if (has("testimonials"))
    insertBefore(sections, "testimonials", ["faq", "cta", "newsletter", "contact", "footer"]);
  else if (sections.includes("testimonials")) hidden.push("testimonials");
  if (
    has("projectImages") &&
    !sections.includes("projects") &&
    !sections.includes("gallery") &&
    !sections.includes("case-study")
  ) {
    insertBefore(sections, "projects", ["testimonials", "faq", "cta", "contact", "footer"]);
  }
  return { sections, hidden };
}
