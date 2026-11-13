import { FIELDS } from "@/recommend/content";
import { AR_1 } from "./ar-1";
import { AR_2 } from "./ar-2";
import { AR_3 } from "./ar-3";

/**
 * The app interface in Arabic. Components keep their English text; when the interface language
 * is Arabic, `UiTranslator` swaps each English text for its Arabic one from this dictionary.
 * Portfolio pages (`.pk-root`) and anything people typed are never touched.
 */
export type UiLang = "en" | "ar";
export const UI_LANG_COOKIE = "pm-ui-lang";

const AR: Record<string, string> = { ...AR_1, ...AR_2, ...AR_3 };
// The onboarding fields already have Arabic names.
for (const field of FIELDS) {
  if (typeof field.name !== "string" && field.name.en && field.name.ar)
    AR[field.name.en] = field.name.ar;
}

/** One word or name from the dictionary, also when it is written in small letters. */
const word = (text: string) => AR[text] ?? AR[text.charAt(0).toUpperCase() + text.slice(1)] ?? text;

const arabicPlural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** Texts with numbers or names in them. */
const PATTERNS: [RegExp, (...groups: string[]) => string][] = [
  [/^Question (\d+) of (\d+)$/, (a, b) => `السؤال ${a} من ${b}`],
  [/^(\d+) months?$/, (n) => arabicPlural(+n, "شهر واحد", "شهران", "أشهر", "شهراً")],
  [/^(\d+) visits?$/, (n) => arabicPlural(+n, "زيارة واحدة", "زيارتان", "زيارات", "زيارة")],
  [/^(\d+) messages?$/, (n) => arabicPlural(+n, "رسالة واحدة", "رسالتان", "رسائل", "رسالة")],
  [/^(\d+) new$/, (n) => `${n} جديدة`],
  [/^(\d+) uses? left today$/, (n) => `متبقٍ اليوم: ${n}`],
  [/^Pro until (.+)$/, (d) => `Pro حتى ${d}`],
  [/^Delete “(.+)”\?$/, (t) => `حذف “${t}”؟`],
  [/^Updated (.+)$/, (d) => `آخر تحديث ${d}`],
  [/^Published (.+)$/, (d) => `نُشر ${d}`],
  [
    /^Downloaded\. (\d+) image\(s\) still load from the internet\.$/,
    (n) => `تم التنزيل. ما زالت ${n} صورة تُحمَّل من الإنترنت.`,
  ],
  [
    /^Showing the newest 100\. The CSV has all (\d+)\.$/,
    (n) => `يظهر أحدث 100. ملف CSV يضم الـ ${n} كلها.`,
  ],
  [/^(\d+) of (\d+)$/, (a, b) => `${a} من ${b}`],
  [/^(\d+) layouts?$/, (n) => arabicPlural(+n, "تخطيط واحد", "تخطيطان", "تخطيطات", "تخطيطاً")],
  [/^([\d,.]+) EGP$/, (n) => `${n} جنيه`],
  [/^([\d,.]+) MB$/, (n) => `${n} ميجابايت`],
  [/^(\d+) a month$/, (n) => `${n} شهرياً`],
  [/^(\d+) uses a day$/, (n) => `${n} استخداماً يومياً`],
  [/^Images: (.+) of (.+)$/, (a, b) => `الصور: ${a} من ${b}`],
  [
    /^Pro is (.+) or (.+) a month, paid in advance for the months you choose\. Nothing renews by itself\.$/,
    (a, b) => `يكلّف Pro ${a} أو ${b} شهرياً، تُدفع مقدماً للأشهر التي تختارها. لا شيء يتجدد تلقائياً.`,
  ],
  [/^Pay (.+) with Paymob$/, (a) => `ادفع ${a} عبر Paymob`],
  [
    /^You have Pro until (.+)\. New months are added after that\.$/,
    (d) => `لديك Pro حتى ${d}. تُضاف الأشهر الجديدة بعد ذلك.`,
  ],
  [/^Pro is yours until (.+)\.$/, (d) => `Pro لك حتى ${d}.`],
  [/^ · (\d+) visits in 30 days$/, (n) => ` · ${n} زيارة خلال 30 يوماً`],
  [/^(\d+) min ago$/, (n) => `منذ ${n} دقيقة`],
  [/^(\d+) h ago$/, (n) => `منذ ${n} ساعة`],
  [/^Open (.+)$/, (t) => `افتح ${t}`],
  [
    /^(Desktop|Tablet|Phone) size$/,
    (d) => (d === "Desktop" ? "حجم الحاسوب" : d === "Tablet" ? "حجم الجهاز اللوحي" : "حجم الهاتف"),
  ],
  [/^Using your color (.+)$/, (c) => `استخدام لونك ${c}`],
  [
    /^Restored the version from (.+)\. Use Undo to go back\.$/,
    (d) => `تمت استعادة نسخة ${d}. استخدم التراجع للعودة.`,
  ],
  [/^(\d+) AI uses left today\.$/, (n) => `متبقٍ اليوم ${n} من استخدامات الذكاء الاصطناعي.`],
  [
    /^Translate from (English|Arabic)$/,
    (l) => `ترجمة من ${l === "English" ? "الإنجليزية" : "العربية"}`,
  ],
  [
    /^Some sections have no (Arabic|English) text yet; visitors will see the other language there\.$/,
    (l) =>
      `بعض الأقسام بلا نص ${l === "Arabic" ? "عربي" : "إنجليزي"} بعد؛ سيرى الزوار اللغة الأخرى هناك.`,
  ],
  [/^Upload failed: (.+)$/, (m) => `فشل الرفع: ${m}`],
  [/^Hard to read: (.+)\.$/, (m) => `يصعب قراءته: ${m}.`],
  [
    /^If (.+) has an account, a reset link is on its way\.$/,
    (e) => `إذا كان لدى ${e} حساب، فرابط إعادة التعيين في الطريق.`,
  ],
  [
    /^We sent a link to (.+)\. Open it to confirm your address and finish signing up\.$/,
    (e) => `أرسلنا رابطاً إلى ${e}. افتحه لتأكيد بريدك وإكمال التسجيل.`,
  ],
  [/^QR code for (.+)$/, (u) => `رمز QR للرابط ${u}`],
  [/^(\d+) of (\d+) done$/, (a, b) => `تم ${a} من ${b}`],
  [/^More actions for (.+)$/, (t) => `مزيد من الإجراءات لـ ${t}`],
  [/^(\S+(?: \S+)?) layout$/, (v) => `تخطيط ${word(v)}`],
  [/^(\S+(?: \S+)?) colors$/, (p) => `ألوان ${word(p)}`],
  [/^(\S+(?: \S+)?) design$/, (f) => `تصميم ${word(f)}`],
  [/^(.+) · Editor · Portfolio Maker$/, (t) => `${t} · المحرر · Portfolio Maker`],
  [
    /^(.+) (portfolio|company page|startup page)$/,
    (f, k) =>
      `${k === "portfolio" ? "ملف" : k === "company page" ? "صفحة شركة" : "صفحة شركة ناشئة"} ${word(f)}`,
  ],
  [
    /^Something different: (.+) design with (.+) colors$/,
    (f, p) => `شيء مختلف: تصميم ${word(f)} بألوان ${word(p)}`,
  ],
  [
    /^(.+) design, (.+) colors(, second layouts)?$/,
    (f, p, second) => `تصميم ${word(f)}، ألوان ${word(p)}${second ? "، تخطيطات بديلة" : ""}`,
  ],
];

const cache = new Map<string, string | null>();

/** The Arabic for one piece of interface text, keeping its surrounding spaces; null if unknown. */
export function translateUi(text: string): string | null {
  const core = text.replace(/\s+/g, " ").trim();
  if (!core || !/[A-Za-z]/.test(core)) return null;
  let found = cache.get(core);
  if (found === undefined) {
    found = AR[core] ?? null;
    // A list such as "Hero, About, Contact": each part on its own.
    if (found === null && core.includes(", ")) {
      const parts = core.split(", ").map((part) => AR[part]);
      if (parts.every(Boolean)) found = parts.join("، ");
    }
    if (found === null) {
      for (const [pattern, make] of PATTERNS) {
        const match = core.match(pattern);
        if (match) {
          found = make(...match.slice(1));
          break;
        }
      }
    }
    if (cache.size > 4000) cache.clear();
    cache.set(core, found);
  }
  if (found === null) return null;
  const lead = /^\s/.test(text) ? " " : "";
  const trail = /\s$/.test(text) ? " " : "";
  return lead + found + trail;
}

/** Pages that never change language with the interface: portfolio pages and their previews. */
export function isPortfolioPath(pathname: string): boolean {
  return /^\/(p|preview|dev)(\/|$)/.test(pathname);
}

export function readUiLang(): UiLang {
  if (typeof document === "undefined") return "en";
  return /(?:^|;\s*)pm-ui-lang=ar(?:;|$)/.test(document.cookie) ? "ar" : "en";
}

export function setUiLang(lang: UiLang) {
  document.cookie = `${UI_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

/**
 * Runs in <head> before the page paints: turns the app right to left for Arabic, so the layout
 * does not jump when the text is swapped after loading.
 */
export const UI_LANG_SCRIPT = `(function(){try{if(/^\\/(p|preview|dev)(\\/|$)/.test(location.pathname))return;if(/(?:^|;\\s*)pm-ui-lang=ar(?:;|$)/.test(document.cookie)){var h=document.documentElement;h.lang="ar";h.dir="rtl";h.classList.add("pm-ui-ar");}}catch(e){}})();`;
