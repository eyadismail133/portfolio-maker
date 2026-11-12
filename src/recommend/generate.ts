import { normalizeDoc } from "@/render-kit/registry";
import { createSampleDoc } from "@/render-kit/samples";
import type { PortfolioDoc, Theme } from "@/render-kit/schema/document";
import type { LocalizedText } from "@/render-kit/schema/primitives";
import { buildPalette } from "@/render-kit/themes/color";
import { getFamily } from "@/render-kit/themes/families";
import { getPalette, palettes } from "@/render-kit/themes/palettes";
import { getField } from "./content";
import { recipeFor } from "./recipes";
import { isOrganisation, STYLES, type Answers, type StyleId, type Who } from "./types";

/** A design direction: a family with optional changes that give it its own character. */
type Look = { name: string; family: string; fonts?: string; radius?: Theme["radius"] };

/** Two looks per style, so one style alone still gives variety. */
export const LOOKS: Record<StyleId, [Look, Look]> = {
  minimal: [
    { name: "Clean minimal", family: "minimal" },
    { name: "Soft minimal", family: "minimal", fonts: "jakarta", radius: "large" },
  ],
  bold: [
    { name: "Big and bold", family: "bold" },
    { name: "Poster", family: "bold", fonts: "expressive", radius: "small" },
  ],
  elegant: [
    { name: "Quiet elegance", family: "elegant" },
    { name: "Classic serif", family: "elegant", fonts: "classic" },
  ],
  playful: [
    { name: "Friendly and round", family: "creative", fonts: "soft", radius: "pill" },
    { name: "Bright and playful", family: "creative", fonts: "friendly", radius: "large" },
  ],
  tech: [
    { name: "Dark terminal", family: "tech" },
    { name: "Sharp product", family: "tech", fonts: "modern", radius: "large" },
  ],
  editorial: [
    { name: "Magazine", family: "minimal", fonts: "bookish", radius: "none" },
    { name: "Editorial serif", family: "elegant", fonts: "caslon" },
  ],
  corporate: [
    { name: "Trusted business", family: "corporate" },
    { name: "Modern corporate", family: "corporate", fonts: "modern", radius: "small" },
  ],
  creative: [
    { name: "Studio", family: "creative" },
    { name: "Art school", family: "creative", fonts: "expressive" },
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
};

type Content = Record<string, unknown>;

const both = (text: string): LocalizedText => text;

/** Puts the person's name, title and field text into the sample content. */
function personalise(doc: PortfolioDoc, answers: Answers): PortfolioDoc {
  const pack = getField(answers.field);
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
): Idea {
  const recipe = recipeFor(answers);
  const family = getFamily(look.family);
  const palette = paletteFor(answers, family.id, index, next);
  const sample = createSampleDoc({
    kind: isOrganisation(answers.who) ? "company" : "personal",
    family: family.id,
    fonts: look.fonts,
    languages: answers.languages.length > 0 ? answers.languages : ["en"],
    sections: recipe.sections,
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
    },
    sections: sample.sections.map((section) => ({
      ...section,
      hidden: recipe.hidden.includes(section.type),
      // Without photos ready, start with the layout that does not lean on one.
      variant: section.type === "about" && !hasPhotos ? "text" : section.variant,
    })),
  };
  return {
    id: `${look.name}-${alternate ? "b" : "a"}-${index}`.toLowerCase().replace(/\s+/g, "-"),
    name: look.name,
    note: surprise
      ? `Something different: ${family.name.toLowerCase()} design with ${palette.name.toLowerCase()} colors`
      : `${family.name} design, ${palette.name.toLowerCase()} colors${alternate ? ", second layouts" : ""}`,
    doc: normalizeDoc(personalise(themed, answers)),
  };
}

/**
 * Six starter portfolios for a set of answers: five in the styles the person chose and one
 * surprise from a style they did not. A different `seed` gives six more.
 */
export function generateIdeas(answers: Answers, seed = 0): Idea[] {
  const next = random(seed);
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
