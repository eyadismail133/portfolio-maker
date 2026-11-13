import { formatMonth, formatRange, pickText, uiText, type UiKey } from "@/render-kit/i18n";
import { plainText } from "@/render-kit/rich-text";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang, LocalizedText } from "@/render-kit/schema/primitives";

/**
 * A printable CV made from the same portfolio document. Only visible sections are used, in the
 * page's language, as plain text (rich-text marks removed).
 */
export type CvEntry = {
  title: string;
  place: string;
  when: string;
  text: string;
  points: string[];
};
export type Cv = {
  lang: Lang;
  name: string;
  title: string;
  summary: string;
  photo: string | null;
  contact: { label: string; value: string; href?: string }[];
  experience: CvEntry[];
  education: CvEntry[];
  projects: CvEntry[];
  skills: { group: string; items: string[] }[];
  languages: { name: string; level: string }[];
  certificates: CvEntry[];
  awards: CvEntry[];
  publications: CvEntry[];
  headings: Record<
    | "summary"
    | "experience"
    | "education"
    | "projects"
    | "skills"
    | "languages"
    | "certificates"
    | "awards"
    | "publications"
    | "contact",
    string
  >;
};

type Content = Record<string, unknown>;
const list = (value: unknown) => (Array.isArray(value) ? (value as Content[]) : []);

const DEFAULT_HEADINGS: Record<Lang, Cv["headings"]> = {
  en: {
    summary: "Profile",
    experience: "Experience",
    education: "Education",
    projects: "Projects",
    skills: "Skills",
    languages: "Languages",
    certificates: "Certificates",
    awards: "Awards",
    publications: "Publications",
    contact: "Contact",
  },
  ar: {
    summary: "نبذة",
    experience: "الخبرات",
    education: "التعليم",
    projects: "المشاريع",
    skills: "المهارات",
    languages: "اللغات",
    certificates: "الشهادات",
    awards: "الجوائز",
    publications: "المنشورات",
    contact: "التواصل",
  },
};

export function buildCv(doc: PortfolioDoc, lang: Lang): Cv {
  const t = (value: unknown) => plainText(pickText(value as LocalizedText, lang)).trim();
  const visible = doc.sections.filter((s) => !s.hidden);
  const first = (type: string) =>
    visible.find((s) => s.type === type)?.content as Content | undefined;
  const all = (type: string) =>
    visible.filter((s) => s.type === type).map((s) => s.content as Content);
  const headings = { ...DEFAULT_HEADINGS[lang] };
  const heading = (type: string, key: keyof Cv["headings"]) => {
    const own = t(first(type)?.heading);
    if (own) headings[key] = own;
  };

  const hero = first("hero") ?? {};
  const about = first("about");
  const contactSection = first("contact");

  const contact: Cv["contact"] = [];
  const add = (label: string, value: string, href?: string) => {
    if (value && !contact.some((c) => c.value === value)) contact.push({ label, value, href });
  };
  if (contactSection) {
    const email = String(contactSection.email ?? "").trim();
    const phone = String(contactSection.phone ?? "").trim();
    add(uiText("email", lang), email, email ? `mailto:${email}` : undefined);
    add(uiText("phone", lang), phone, phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined);
    add(uiText("location", lang), t(contactSection.location));
  }
  const links = [
    ...list(contactSection?.socials),
    ...all("social-links").flatMap((c) => list(c.items)),
  ];
  for (const link of links) {
    const href = String(link.href ?? "").trim();
    if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?[^/]+\/?$/i.test(href))
      add(t(link.label), href.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""), href);
  }

  const range = (start: unknown, end: unknown) =>
    formatRange(String(start ?? ""), String(end ?? ""), lang);
  const entries = (type: string, map: (item: Content) => CvEntry) =>
    all(type)
      .flatMap((c) => list(c.items).map(map))
      .filter((e) => e.title || e.place);

  heading("about", "summary");
  heading("work-experience", "experience");
  heading("education", "education");
  heading("projects", "projects");
  heading("skills", "skills");
  heading("languages", "languages");
  heading("certificates", "certificates");
  heading("awards", "awards");
  heading("publications", "publications");

  const photo = (hero.image as { url?: string } | undefined)?.url ?? null;
  return {
    lang,
    name: t(hero.name) || doc.meta.title,
    title: t(hero.title),
    summary: t(about?.body) || t(hero.intro),
    photo: photo && /^https:\/\//.test(photo) ? photo : null,
    contact,
    experience: entries("work-experience", (i) => ({
      title: t(i.role),
      place: [t(i.company), t(i.location)].filter(Boolean).join(lang === "ar" ? "، " : ", "),
      when: range(i.start, i.end),
      text: t(i.description),
      points: (Array.isArray(i.achievements) ? i.achievements : []).map(t).filter(Boolean),
    })),
    education: entries("education", (i) => ({
      title: t(i.degree),
      place: [t(i.school), t(i.location)].filter(Boolean).join(lang === "ar" ? "، " : ", "),
      when: range(i.start, i.end),
      text: [t(i.grade), t(i.notes)].filter(Boolean).join(". "),
      points: [],
    })),
    projects: entries("projects", (i) => ({
      title: t(i.title),
      place: (Array.isArray(i.tags) ? i.tags : []).map(t).filter(Boolean).join(", "),
      when: String(i.year ?? ""),
      text: t(i.description),
      points: [],
    })),
    skills: all("skills").flatMap((c) =>
      list(c.groups)
        .map((g) => ({
          group: t(g.name),
          items: list(g.items)
            .map((s) => t(s.name))
            .filter(Boolean),
        }))
        .filter((g) => g.items.length > 0),
    ),
    languages: all("languages").flatMap((c) =>
      list(c.items)
        .map((i) => ({
          name: t(i.name),
          level: uiText(String(i.level ?? "fluent") as UiKey, lang),
        }))
        .filter((i) => i.name),
    ),
    certificates: entries("certificates", (i) => ({
      title: t(i.name),
      place: t(i.issuer),
      when: formatMonth(String(i.date ?? ""), lang),
      text: "",
      points: [],
    })),
    awards: entries("awards", (i) => ({
      title: t(i.title),
      place: t(i.organization),
      when: String(i.year ?? ""),
      text: t(i.description),
      points: [],
    })),
    publications: entries("publications", (i) => ({
      title: t(i.title),
      place: t(i.venue),
      when: String(i.year ?? ""),
      text: "",
      points: [],
    })),
    headings,
  };
}
