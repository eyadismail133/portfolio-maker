import { allSections, getSection, normalizeDoc } from "./registry";
import { SCHEMA_VERSION, type PortfolioDoc, type Theme } from "./schema/document";
import type { Lang } from "./schema/primitives";
import "./sections";
import { getFamily } from "./themes/families";
import { getPalette } from "./themes/palettes";

export type SampleOptions = {
  family?: string;
  palette?: string;
  fonts?: string;
  mode?: Theme["mode"];
  languages?: Lang[];
  /** Which kind of portfolio to build. */
  kind?: SampleKind;
  /** Section types in page order, each with an optional variant: "hero" or "hero:centered". Wins over `kind`. */
  sections?: string[];
  /** Use the second variant of every section, to see the other layouts. */
  alternate?: boolean;
};

const L = (en: string, ar: string) => ({ en, ar });

export type SampleKind = "personal" | "company" | "startup" | "everything";

/** Section lists for the kinds of portfolio. Phase 4 replaces these with the idea generator. */
export const RECIPES: Record<SampleKind, string[]> = {
  personal: [
    "navbar",
    "hero",
    "about",
    "work-experience",
    "projects",
    "skills",
    "education",
    "languages",
    "testimonials",
    "cta",
    "contact",
    "footer",
  ],
  company: [
    "navbar",
    "hero",
    "logo-strip",
    "services",
    "stats",
    "case-study",
    "how-it-works",
    "team",
    "testimonials",
    "pricing",
    "faq",
    "cta",
    "map",
    "footer",
  ],
  startup: [
    "navbar",
    "hero",
    "problem-solution",
    "features",
    "stats",
    "timeline",
    "team",
    "press",
    "partners",
    "mission-values",
    "newsletter",
    "footer",
  ],
  everything: [],
};
export const PERSONAL_RECIPE = RECIPES.personal;

/** Text for the shared sections when the sample is about the company instead of a person. */
export const COMPANY_CONTENT: Record<string, Record<string, unknown>> = {
  navbar: {
    brand: L("Marsa", "مرسى"),
    cta: { label: L("Book a demo", "احجز عرضاً"), href: "#contact" },
  },
  hero: {
    name: L("Booking software clinics actually use", "برنامج حجز تستخدمه العيادات فعلاً"),
    title: L("Marsa, Alexandria", "مرسى، الإسكندرية"),
    intro: L(
      "Online booking, patient records and payments for private clinics in Egypt. Live in two weeks, in Arabic and English.",
      "حجز عبر الإنترنت وسجلات مرضى ومدفوعات للعيادات الخاصة في مصر. جاهز خلال أسبوعين، بالعربية والإنجليزية.",
    ),
    status: L(
      "63 clinics booked 1.4 million appointments with Marsa",
      "63 عيادة حجزت 1.4 مليون موعد عبر مرسى",
    ),
    primaryCta: { label: L("Book a demo", "احجز عرضاً"), href: "#contact" },
    secondaryCta: { label: L("See pricing", "شاهد الأسعار"), href: "#pricing" },
  },
  testimonials: {
    heading: L("What clinic owners say", "ماذا يقول أصحاب العيادات"),
    items: [
      {
        quote: L(
          "We used to lose one appointment in five. Now the waiting room is full and nobody is shouting at reception.",
          "كنا نخسر موعداً من كل خمسة. الآن غرفة الانتظار ممتلئة ولا أحد يصرخ عند الاستقبال.",
        ),
        name: L("Dr. Hala Mostafa", "د. هالة مصطفى"),
        role: L("Owner, Shifa Clinics", "مالكة عيادات شفاء"),
      },
      {
        quote: L(
          "My receptionist learned it in one morning. I check the numbers on my phone at breakfast.",
          "تعلّمته موظفة الاستقبال في صباح واحد. أراجع الأرقام على هاتفي عند الإفطار.",
        ),
        name: L("Dr. Sherif Nabil", "د. شريف نبيل"),
        role: L("Andalus Dental", "أندلس لطب الأسنان"),
      },
    ],
  },
  cta: {
    heading: L("See it with your own clinic's schedule", "شاهده بجدول عيادتك أنت"),
    body: L(
      "A 30-minute demo using your real doctors and opening hours.",
      "عرض مدته 30 دقيقة باستخدام أطبائك ومواعيد عملك الحقيقية.",
    ),
    button: { label: L("Book a demo", "احجز عرضاً"), href: "#contact" },
  },
  footer: {
    name: L("Marsa", "مرسى"),
    tagline: L("Clinic software from Alexandria", "برامج عيادات من الإسكندرية"),
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: L("Email", "البريد"), href: "mailto:hello@example.com" },
    ],
    copyright: L("© 2026 Marsa Software", "© 2026 مرسى للبرمجيات"),
  },
};

/** Builds a complete document from the sample content of each section. */
export function createSampleDoc(options: SampleOptions = {}): PortfolioDoc {
  const family = getFamily(options.family ?? "minimal");
  const palette = getPalette(options.palette ?? family.defaults.palette);
  const kind = options.kind ?? "personal";
  const recipe = kind === "everything" ? allSections().map((s) => s.type) : RECIPES[kind];
  const company = kind === "company" || kind === "startup";
  const surface = new Set([
    "skills",
    "testimonials",
    "stats",
    "how-it-works",
    "features",
    "faq",
    "partners",
  ]);
  const sections = (options.sections ?? recipe).flatMap((entry) => {
    const [type, wanted] = entry.split(":");
    const def = getSection(type);
    if (!def) return [];
    const names = Object.keys(def.variants);
    const fallback = options.alternate
      ? (names.find((n) => n !== def.defaultVariant) ?? def.defaultVariant)
      : (family.preferredVariants[type] ?? def.defaultVariant);
    return [
      {
        id: type,
        type,
        variant: wanted ?? fallback,
        hidden: false,
        content: { ...def.defaults(), ...(company ? COMPANY_CONTENT[type] : undefined) },
        style: surface.has(type) ? { background: "surface" } : undefined,
      },
    ];
  });
  return normalizeDoc({
    schemaVersion: SCHEMA_VERSION,
    meta: {
      title: company ? "Marsa, booking software for clinics" : "Layla Hassan, product designer",
      description: company
        ? "Online booking, patient records and payments for private clinics in Egypt."
        : "Portfolio of Layla Hassan, a product designer in Cairo.",
      languages: options.languages ?? ["en", "ar"],
    },
    theme: {
      family: family.id,
      palette: palette.light,
      paletteDark: palette.dark,
      mode: options.mode ?? family.defaults.mode,
      fonts: options.fonts ?? family.defaults.fonts,
      radius: family.defaults.radius,
      spacing: family.defaults.spacing,
      animation: "subtle",
    },
    sections,
  });
}
