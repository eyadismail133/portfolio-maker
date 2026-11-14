import { cacheLife, cacheTag } from "next/cache";
import { isAppHost } from "@/lib/custom-domain";
import { getPublished, publishedTag } from "@/lib/published";
import { NOT_FOUND_HTML } from "@/lib/published-check";
import { buildHtmlPage } from "@/render-kit/html-page";
import { PAGE_CSS } from "@/render-kit/generated/page-css";
import { PAGE_SCRIPT } from "@/render-kit/page-script";
import { siteUrl } from "@/lib/site";
import { turnstileSiteKey } from "@/lib/visitor-check";
import type { Lang } from "@/render-kit/schema/primitives";

const BADGE_STYLE =
  "position:fixed;inset-block-end:12px;inset-inline-end:12px;z-index:50;border-radius:999px;background:rgba(24,24,27,.88);color:#fff;font:500 12px/1 system-ui,-apple-system,'Segoe UI',sans-serif;padding:8px 14px;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.25)";
const REPORT_STYLE =
  "margin:0;padding:12px;text-align:center;font:12px system-ui,-apple-system,'Segoe UI',sans-serif;background:#fff;color:#71717a";

function resolveLang(languages: Lang[], wanted?: string): Lang | null {
  if (!wanted) return languages[0];
  return languages.includes(wanted as Lang) && wanted !== languages[0] ? (wanted as Lang) : null;
}

const notFound = () =>
  new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

/**
 * A published portfolio as one complete HTML document, the same file "Download HTML" makes,
 * plus the badge, the report link, the visit counter and the inbox form address. Everything is
 * in the HTML from the first byte: scripts are only extras, so the page works without them,
 * and link previews and crawlers see the whole page.
 */
export async function publishedResponse(request: Request, slug: string, wanted?: string) {
  const found = await getPublished(slug);
  if (!found) return notFound();
  const lang = resolveLang(found.doc.meta.languages, wanted);
  if (!lang) return notFound();

  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const onOwnDomain = !isAppHost(host);
  const origin = `${url.protocol}//${host}`;
  // Cloudflare's free check only works on our own hostnames (see src/lib/visitor-check.ts).
  const spamCheckKey = onOwnDomain ? null : turnstileSiteKey();
  const html = await publishedHtml(slug, lang, origin, onOwnDomain, spamCheckKey);
  if (html === null) return notFound();
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Always fresh, so a new publish shows at once; the page itself is cached on the server.
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

/**
 * The finished HTML of one page, language and address. Drawing a whole page takes real work, so
 * it is cached like the page data and thrown away by the same tag when the owner publishes.
 * Only a few addresses reach this (the app's own and the owner's domain), so few copies exist.
 */
async function publishedHtml(
  slug: string,
  lang: Lang,
  origin: string,
  onOwnDomain: boolean,
  spamCheckKey: string | null,
): Promise<string | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(publishedTag(slug));
  const found = await getPublished(slug);
  if (!found) return null;
  const { doc } = found;
  const base = onOwnDomain ? "" : `/p/${slug}`;
  const pathFor = (l: Lang) => (l === doc.meta.languages[0] ? base || "/" : `${base}/${l}`);
  const languageHrefs =
    doc.meta.languages.length > 1
      ? Object.fromEntries(doc.meta.languages.map((l) => [l, pathFor(l)]))
      : undefined;

  const counter = `navigator.sendBeacon&&navigator.sendBeacon(${JSON.stringify(`/api/view?slug=${slug}`)});`;
  const badge = found.showBadge
    ? `<a href="${onOwnDomain ? siteUrl() : ""}/" style="${BADGE_STYLE}">Made with Portfolio Maker</a>`
    : "";
  const report = `<p style="${REPORT_STYLE}"><a href="/report?page=${slug}" rel="nofollow" style="color:inherit">${lang === "ar" ? "الإبلاغ عن هذه الصفحة" : "Report this page"}</a></p>`;

  // Loaded here, not at the top: Next.js does not allow react-dom/server in a route's imports.
  const { renderToStaticMarkup } = await import("react-dom/server");
  return buildHtmlPage(renderToStaticMarkup, doc, {
    lang,
    css: PAGE_CSS,
    script: `${PAGE_SCRIPT}\n${counter}`,
    languageHrefs,
    formAction: `/api/contact?slug=${slug}`,
    canonical: `${origin}${pathFor(lang)}`,
    fallbackShareImage: `${origin}/api/og?slug=${encodeURIComponent(slug)}&lang=${lang}`,
    trustedFooter: badge + report,
    spamCheckKey: spamCheckKey ?? undefined,
  });
}
