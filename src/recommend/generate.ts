import { normalizeDoc } from "@/render-kit/registry";
import { createSampleDoc } from "@/render-kit/samples";
import type { PortfolioDoc, Theme } from "@/render-kit/schema/document";
import type { LocalizedText } from "@/render-kit/schema/primitives";
import { buildPalette } from "@/render-kit/themes/color";
import { getFamily } from "@/render-kit/themes/families";
import { getPalette, palettes } from "@/render-kit/themes/palettes";
import { randomTouches, varyLayouts } from "@/render-kit/themes/variety";
import { getBusiness } from "./business-content";
import { getField } from "./content";
import { recipeFor } from "./recipes";
import { isOrganisation, STYLES, type Answers, type StyleId, type Who } from "./types";

/**
 * A design direction: a family with optional changes that give it its own character, from
 * fonts and corners to page-wide touches and signature layouts.
 */
type Look = {
  name: string;
  family: string;
  fonts?: string;
  radius?: Theme["radius"];
  touches?: Partial<Theme>;
  /** Layout per section type, where the look wants another one than its family. */
  layouts?: Record<string, string>;
};

/** Two looks per style, so one style alone still gives variety. */
export const LOOKS: Record<StyleId, [Look, Look]> = {
  minimal: [
    { name: "Clean minimal", family: "minimal" },
    {
      name: "Soft minimal",
      family: "minimal",
      fonts: "jakarta",
      radius: "large",
      touches: { imageShape: "rounded", buttons: "soft", headingDeco: "line" },
      layouts: { projects: "slider", navbar: "floating" },
    },
  ],
  bold: [
    {
      name: "Big and bold",
      family: "bold",
      touches: { headingCase: "upper" },
      layouts: { hero: "statement", stats: "big", footer: "big" },
    },
    {
      name: "Raw brutalist",
      family: "brutalist",
      touches: { pattern: "grid" },
      layouts: { projects: "index", cta: "statement" },
    },
  ],
  elegant: [
    { name: "Quiet elegance", family: "elegant", touches: { imageShape: "arch" } },
    {
      name: "Classic serif",
      family: "elegant",
      fonts: "classic",
      touches: { headingDeco: "underline", buttons: "underline" },
      layouts: { "work-experience": "compact", education: "compact" },
    },
  ],
  playful: [
    {
      name: "Friendly and round",
      family: "playful",
      touches: { imageShape: "blob", pattern: "dots" },
      layouts: { skills: "cards", navbar: "floating" },
    },
    {
      name: "Bright and playful",
      family: "creative",
      fonts: "friendly",
      radius: "large",
      touches: { headingDeco: "marker" },
      layouts: { testimonials: "wall", cta: "card" },
    },
  ],
  tech: [
    {
      name: "Dark terminal",
      family: "tech",
      touches: { headingDeco: "number" },
      layouts: { skills: "dots", projects: "index" },
    },
    {
      name: "Frosted glass",
      family: "glass",
      touches: { pattern: "glow" },
      layouts: { navbar: "floating", hero: "cover", testimonials: "slider" },
    },
  ],
  editorial: [
    {
      name: "Magazine",
      family: "editorial",
      layouts: { hero: "statement", projects: "masonry", "work-experience": "compact" },
    },
    {
      name: "Editorial serif",
      family: "elegant",
      fonts: "caslon",
      touches: { headingDeco: "number", imageShape: "square" },
      layouts: { footer: "big" },
    },
  ],
  corporate: [
    { name: "Trusted business", family: "corporate" },
    { name: "Classic CV", family: "classic-cv" },
  ],
  creative: [
    {
      name: "Studio",
      family: "creative",
      touches: { imageShape: "tilted" },
      layouts: { projects: "masonry", features: "big" },
    },
    {
      name: "Bright gradient",
      family: "gradient",
      touches: { pattern: "glow", buttons: "solid" },
      layouts: { navbar: "floating", features: "big", cta: "card" },
    },
  ],
};

const DEFAULT_STYLES: Record<Who, [StyleId, StyleId]> = {
  professional: ["minimal", "corporate"],
  student: ["minimal", "playful"],
  freelancer: ["minimal", "creative"],
  creative: ["creative", "bold"],
  company: ["corporate", "minimal"],
  agency: ["bold", "creative"],
  startup: ["tech", "bold"],
  other: ["minimal", "elegant"],
};

/** A small repeatable random number generator, so the same answers and seed give the same ideas. */
function random(seed: number) {
  let a = (seed + 1) * 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type Idea = {
  id: string;
  name: string;
  /** One line under the name: what makes this idea different. */
  note: string;
  doc: PortfolioDoc;
  /** A Pro preset: anyone can try it, publishing needs Pro (it uses showcase sections). */
  pro?: true;
};

type Content = Record<string, unknown>;

const both = (text: string): LocalizedText => text;

/** Puts the person's name, title and field text into the sample content. */
function personalise(doc: PortfolioDoc, answers: Answers): PortfolioDoc {
  const pack = getField(answers.field);
  const business = getBusiness(answers.field);
  const organisation = isOrganisation(answers.who);
  const name = answers.name.trim();
  const title = answers.title.trim();
  const year = new Date().getFullYear();

  const edits: Record<string, (content: Content) => Content> = {
    navbar: (c) => (name ? { ...c, brand: both(name) } : c),
    footer: (c) =>
      name
        ? {
            ...c,
            name: both(name),
            tagline: title ? both(title) : (pack?.title ?? c.tagline),
            copyright: both(`© ${year} ${name}`),
          }
        : c,
    hero: (c) => {
      if (organisation) {
        return {
          ...c,
          title: name ? both(name) : c.title,
          name: title ? both(title) : (pack?.headline ?? c.name),
          intro: pack?.intro ?? c.intro,
          status: "",
        };
      }
      return {
        ...c,
        name: name ? both(name) : c.name,
        title: title ? both(title) : (pack?.title ?? c.title),
        intro: pack?.intro ?? c.intro,
      };
    },
    about: (c) => (pack ? { ...c, body: pack.about } : c),
    skills: (c) =>
      pack
        ? {
            ...c,
            groups: [{ name: pack.name, items: pack.skills.map((skill) => ({ name: skill })) }],
          }
        : c,
    services: (c) =>
      pack ? { ...c, items: pack.services.map((service) => ({ ...service, price: "" })) } : c,
    "how-it-works": (c) => (business ? { ...c, steps: business.steps } : c),
    faq: (c) => (business ? { ...c, items: business.faq } : c),
    "case-study": (c) => (business ? { ...c, ...business.caseStudy, year: String(year - 1) } : c),
  };

  const sections = doc.sections.map((section) => {
    const edit = edits[section.type];
    return edit ? { ...section, content: edit(section.content as Content) } : section;
  });

  const label =
    title || (pack ? (typeof pack.title === "string" ? pack.title : (pack.title.en ?? "")) : "");
  return {
    ...doc,
    meta: {
      ...doc.meta,
      title: name ? [name, label].filter(Boolean).join(", ") : doc.meta.title,
      description: name
        ? `Portfolio of ${name}${label ? `, ${label.toLowerCase()}` : ""}.`
        : doc.meta.description,
    },
    sections,
  };
}

function paletteFor(answers: Answers, family: string, index: number, next: () => number) {
  if (answers.brandColor) {
    return {
      name: "your brand color",
      light: buildPalette(answers.brandColor, "light"),
      dark: buildPalette(answers.brandColor, "dark"),
    };
  }
  const base = getPalette(answers.palette ?? getFamily(family).defaults.palette);
  // The first ideas keep the chosen colors; later ones try neighbours with the same mood.
  if (index < 3) return base;
  const neighbours = palettes.filter((p) => p.mood === base.mood && p.id !== base.id);
  return neighbours.length > 0 ? neighbours[Math.floor(next() * neighbours.length)] : base;
}

function buildIdea(
  answers: Answers,
  look: Look,
  alternate: boolean,
  index: number,
  next: () => number,
  surprise: boolean,
  /** Section list to use instead of the recipe (Pro presets add showcase sections). */
  sections?: string[],
): Idea {
  const recipe = recipeFor(answers);
  const family = getFamily(look.family);
  const palette = paletteFor(answers, family.id, index, next);
  const sample = createSampleDoc({
    kind: isOrganisation(answers.who) ? "company" : "personal",
    family: family.id,
    fonts: look.fonts,
    languages: answers.languages.length > 0 ? answers.languages : ["en"],
    sections: sections ?? recipe.sections,
    alternate,
  });
  const hasPhotos = answers.assets.includes("photos");
  const themed: PortfolioDoc = {
    ...sample,
    theme: {
      ...sample.theme,
      palette: palette.light,
      paletteDark: palette.dark,
      mode: answers.mode ?? family.defaults.mode,
      radius: look.radius ?? sample.theme.radius,
      ...look.touches,
      // Later ideas in a batch get a few extra touches of their own, so none look alike.
      ...(index >= 2 ? randomTouches(next) : {}),
    },
    sections: sample.sections.map((section) => ({
      ...section,
      hidden: recipe.hidden.includes(section.type),
      // Without photos ready, start with the layout that does not lean on one.
      variant:
        section.type === "about" && !hasPhotos
          ? "text"
          : (look.layouts?.[section.type] ?? section.variant),
    })),
  };
  const varied = index >= 2 ? varyLayouts(themed, next, 0.35) : themed;
  return {
    id: `${look.name}-${alternate ? "b" : "a"}-${index}`.toLowerCase().replace(/\s+/g, "-"),
    name: look.name,
    note: surprise
      ? `Something different: ${family.name.toLowerCase()} design with ${palette.name.toLowerCase()} colors`
      : `${family.name} design, ${palette.name.toLowerCase()} colors${alternate ? ", second layouts" : ""}`,
    doc: normalizeDoc(personalise(varied, answers)),
  };
}

/** Looks only on the mood board: the designs added in Phase 8E. */
const EXTRA_LOOKS: Look[] = [
  { name: "Dark luxury", family: "luxury", touches: { imageShape: "arch" } },
  { name: "Warm retro", family: "retro", touches: { pattern: "dots", imageShape: "rounded" } },
  { name: "Swiss grid", family: "swiss", layouts: { "work-experience": "compact" } },
];

const lookId = (look: Look) => look.name.toLowerCase().replace(/\s+/g, "-");

/** Every look, for the mood board ("Pick three looks"). */
export const MOOD_LOOKS: (Look & { id: string })[] = [
  ...STYLES.flatMap((style) => LOOKS[style]),
  ...EXTRA_LOOKS,
].map((look) => ({ ...look, id: lookId(look) }));

/**
 * One look's design with another look's type, corners and touches: what "mixing" two looks from
 * the mood board means.
 */
export function mixLooks(a: Look, b: Look): Look {
  const other = getFamily(b.family).defaults;
  return {
    name: `${a.name} + ${b.name}`,
    family: a.family,
    fonts: b.fonts ?? other.fonts,
    radius: b.radius ?? other.radius,
    touches: { ...a.touches, ...b.touches },
    layouts: { ...b.layouts, ...a.layouts },
  };
}

/**
 * Six ideas from up to three looks picked on the mood board: each look as it is, then mixes of
 * every two of them, then each look with its second layouts. A different `seed` starts further on.
 */
function moodIdeas(answers: Answers, looks: Look[], seed: number): Idea[] {
  const next = random(seed);
  const mixes = looks.flatMap((a, i) => looks.filter((_, j) => j !== i).map((b) => mixLooks(a, b)));
  const options = [
    ...looks.map((look) => ({ look, alternate: false })),
    ...mixes.map((look) => ({ look, alternate: false })),
    ...looks.map((look) => ({ look, alternate: true })),
  ];
  const start = (seed * 6) % options.length;
  const picks = Array.from({ length: 6 }, (_, i) => options[(start + i) % options.length]);
  return picks.map((pick, i) => buildIdea(answers, pick.look, pick.alternate, i, next, false));
}

/**
 * Six starter portfolios for a set of answers: five in the styles the person chose and one
 * surprise from a style they did not. A different `seed` gives six more.
 */
export function generateIdeas(answers: Answers, seed = 0): Idea[] {
  const next = random(seed);
  const mood = (answers.looks ?? [])
    .map((id) => MOOD_LOOKS.find((look) => look.id === id))
    .filter((look): look is Look & { id: string } => Boolean(look))
    .slice(0, 3);
  if (mood.length > 0) return moodIdeas(answers, mood, seed);
  const who = answers.who ?? "professional";
  const chosen = answers.styles.length > 0 ? answers.styles.slice(0, 2) : DEFAULT_STYLES[who];
  const options = chosen
    .flatMap((style) => LOOKS[style])
    .flatMap((look) => [false, true].map((alternate) => ({ look, alternate })));

  // Walk through the options so each batch of six starts where the last one stopped.
  const order = seed === 0 ? options : shuffled(options, next);
  const picks: { look: Look; alternate: boolean }[] = [];
  for (let i = 0; picks.length < 5; i += 1) {
    const option = order[(i * 3 + seed * 5) % order.length];
    const repeated = picks.some((p) => p.look === option.look && p.alternate === option.alternate);
    if (!repeated || i >= order.length * 2) picks.push(option);
  }

  const others = STYLES.filter((style) => !chosen.includes(style));
  const surpriseStyle = others[Math.floor(next() * others.length)] ?? "minimal";
  const surprise = LOOKS[surpriseStyle][Math.floor(next() * 2)];

  return [
    ...picks.map((pick, i) => buildIdea(answers, pick.look, pick.alternate, i, next, false)),
    buildIdea(answers, surprise, next() > 0.5, 5, next, true),
  ];
}

/** The smallest possible start: navbar, hero and footer with the person's name. */
export function blankStart(answers: Answers): PortfolioDoc {
  const sample = createSampleDoc({
    kind: isOrganisation(answers.who) ? "company" : "personal",
    languages: answers.languages.length > 0 ? answers.languages : ["en"],
    sections: ["navbar", "hero", "footer"],
  });
  return normalizeDoc(personalise(sample, answers));
}

/** Where a showcase section goes: after the first of these sections the page has. */
type Placement = [entry: string, after: string[]];

/**
 * Pro presets: whole pages built around the showcase sections. Shown under the ideas and in the
 * template gallery; anyone can try them, publishing needs Pro.
 */
export const PRO_PRESETS: { id: string; look: Look; adds: Placement[] }[] = [
  {
    id: "launch",
    look: { name: "Product launch", family: "gradient" },
    adds: [
      ["showcase-devices:duo", ["hero"]],
      ["showcase-marquee:words", ["showcase-devices"]],
      ["showcase-bento:mosaic", ["services", "features", "projects", "about"]],
    ],
  },
  {
    id: "studio",
    look: { name: "Studio showcase", family: "swiss" },
    adds: [
      ["showcase-marquee:tags", ["hero"]],
      ["showcase-bento:grid", ["projects", "services", "about"]],
      ["showcase-devices:laptop", ["case-study", "projects", "showcase-bento"]],
    ],
  },
];

/** A section list with the showcase sections placed in it (before the footer if no anchor). */
export function withShowcase(types: readonly string[], adds: readonly Placement[]): string[] {
  const list = [...types];
  const at = (type: string) => list.findIndex((entry) => entry.split(":")[0] === type);
  for (const [entry, after] of adds) {
    if (at(entry.split(":")[0]) !== -1) continue;
    const anchor = after.map(at).find((i) => i !== -1);
    const footer = at("footer");
    list.splice(anchor !== undefined ? anchor + 1 : footer !== -1 ? footer : list.length, 0, entry);
  }
  return list;
}

/** The two Pro presets, personalised with the answers like the ideas. */
export function proPresets(answers: Answers): Idea[] {
  const next = random(7);
  return PRO_PRESETS.map((preset, i) => ({
    ...buildIdea(
      answers,
      preset.look,
      false,
      i,
      next,
      false,
      withShowcase(recipeFor(answers).sections, preset.adds),
    ),
    pro: true as const,
  }));
}
