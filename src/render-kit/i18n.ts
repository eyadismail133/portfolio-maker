import type { Lang, LocalizedText } from "./schema";

export function dirOf(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

/** Picks the text for a language, falling back to the other language. */
export function pickText(value: LocalizedText | undefined, lang: Lang): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? value.ar ?? "";
}

const UI = {
  present: { en: "Present", ar: "حتى الآن" },
  menu: { en: "Menu", ar: "القائمة" },
  name: { en: "Your name", ar: "الاسم" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  phone: { en: "Phone", ar: "الهاتف" },
  location: { en: "Location", ar: "الموقع" },
  message: { en: "Message", ar: "الرسالة" },
  send: { en: "Send message", ar: "إرسال الرسالة" },
  viewProject: { en: "View project", ar: "عرض المشروع" },
  native: { en: "Native", ar: "اللغة الأم" },
  fluent: { en: "Fluent", ar: "بطلاقة" },
  advanced: { en: "Advanced", ar: "متقدم" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  basic: { en: "Basic", ar: "مبتدئ" },
  skipToContent: { en: "Skip to content", ar: "انتقل إلى المحتوى" },
} as const;
export type UiKey = keyof typeof UI;

/** Built-in words the page needs, such as "Present" or "Send message". */
export function uiText(key: UiKey, lang: Lang): string {
  return UI[key][lang];
}

/** "2023-04" becomes "Apr 2023"; "2023" stays "2023". */
export function formatMonth(value: string, lang: Lang): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!month) return year;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatRange(start: string, end: string, lang: Lang): string {
  const from = formatMonth(start, lang);
  const to = end === "current" ? uiText("present", lang) : formatMonth(end, lang);
  if (from && to) return from === to ? from : `${from} – ${to}`;
  return from || to;
}

/** Allows normal web, mail, phone and in-page links. Anything else becomes "#". */
export function safeHref(href: string | undefined): string {
  const value = (href ?? "").trim();
  if (!value) return "#";
  if (/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(value)) return value;
  return "#";
}

/** Allows only web and site-relative image addresses. */
export function safeImageUrl(url: string | undefined): string | null {
  const value = (url ?? "").trim();
  if (/^(https?:\/\/|\/(?!\/))/i.test(value)) return value;
  return null;
}
