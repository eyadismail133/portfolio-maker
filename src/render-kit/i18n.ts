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
  sending: { en: "Sending…", ar: "جارٍ الإرسال…" },
  sent: { en: "Thank you. Your message was sent.", ar: "شكراً لك. تم إرسال رسالتك." },
  sendFailed: {
    en: "The message could not be sent. Try again.",
    ar: "تعذّر إرسال الرسالة. حاول مرة أخرى.",
  },
  close: { en: "Close", ar: "إغلاق" },
  skipToContent: { en: "Skip to content", ar: "انتقل إلى المحتوى" },
  viewCertificate: { en: "View certificate", ar: "عرض الشهادة" },
  challenge: { en: "The challenge", ar: "التحدي" },
  solution: { en: "What we did", ar: "ما قمنا به" },
  result: { en: "The result", ar: "النتيجة" },
  client: { en: "Client", ar: "العميل" },
  year: { en: "Year", ar: "السنة" },
  role: { en: "Role", ar: "الدور" },
  subscribe: { en: "Subscribe", ar: "اشترك" },
  yourEmail: { en: "Your email address", ar: "بريدك الإلكتروني" },
  addVideo: { en: "Add a YouTube or Vimeo link", ar: "أضف رابط يوتيوب أو فيميو" },
  popular: { en: "Most popular", ar: "الأكثر طلباً" },
  readArticle: { en: "Read the article", ar: "اقرأ المقال" },
  openMap: { en: "Open in Google Maps", ar: "افتح في خرائط جوجل" },
  mission: { en: "Mission", ar: "رسالتنا" },
  vision: { en: "Vision", ar: "رؤيتنا" },
  read: { en: "Read", ar: "اقرأ" },
  watch: { en: "Watch", ar: "شاهد" },
  before: { en: "Before", ar: "قبل" },
  after: { en: "After", ar: "بعد" },
  compare: { en: "Move to compare before and after", ar: "حرّك للمقارنة بين قبل وبعد" },
  apply: { en: "Apply", ar: "قدّم الآن" },
  noJobs: { en: "No open roles right now.", ar: "لا توجد وظائف متاحة حالياً." },
  book: { en: "Book a time", ar: "احجز موعداً" },
  addBooking: { en: "Add a Calendly link", ar: "أضف رابط Calendly" },
  bookingTitle: { en: "Booking calendar", ar: "تقويم الحجز" },
  darkMode: { en: "Dark mode", ar: "الوضع الداكن" },
  signedUp: { en: "Thank you. You are signed up.", ar: "شكراً لك. تم تسجيلك." },
  signupFailed: {
    en: "The sign-up did not go through. Try again.",
    ar: "لم يتم التسجيل. حاول مرة أخرى.",
  },
} as const;
export type UiKey = keyof typeof UI;

/** Built-in words the page needs, such as "Present" or "Send message". */
export function uiText(key: UiKey, lang: Lang): string {
  return UI[key][lang];
}

/**
 * A booking link that can be shown inside the page. Only Calendly is embedded; any other https
 * link (Cal.com, Google Calendar and so on) is shown as a button instead.
 */
export function bookingEmbedUrl(url: string | undefined): string | null {
  let parsed: URL;
  try {
    parsed = new URL((url ?? "").trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "calendly.com" || parsed.pathname.split("/").filter(Boolean).length === 0)
    return null;
  parsed.searchParams.set("hide_gdpr_banner", "1");
  return `https://calendly.com${parsed.pathname}?${parsed.searchParams.toString()}`;
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

/** Allows web addresses, site-relative addresses, and files next to an exported page ("images/1.webp"). */
export function safeImageUrl(url: string | undefined): string | null {
  const value = (url ?? "").trim();
  if (/^(https?:\/\/|\/(?!\/))/i.test(value)) return value;
  if (/^images\/[\w.-]+$/.test(value)) return value;
  return null;
}

/** Turns a YouTube or Vimeo page address into its player address. Other sites are refused. */
export function videoEmbedUrl(url: string | undefined): string | null {
  let parsed: URL;
  try {
    parsed = new URL((url ?? "").trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const host = parsed.hostname.replace(/^(www|m)\./, "");
  const parts = parsed.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  if (host === "youtu.be") id = parts[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      parts[0] === "watch"
        ? (parsed.searchParams.get("v") ?? undefined)
        : ["embed", "shorts", "live"].includes(parts[0])
          ? parts[1]
          : undefined;
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoId = parts[parts.length - 1];
    if (vimeoId && /^\d{5,12}$/.test(vimeoId)) return `https://player.vimeo.com/video/${vimeoId}`;
  }
  return null;
}

/** Google Maps frame address for a place name or street address. */
export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** Only real web addresses may receive form posts. */
export function safeFormAction(url: string | undefined): string | undefined {
  const value = (url ?? "").trim();
  return /^https:\/\//i.test(value) ? value : undefined;
}
