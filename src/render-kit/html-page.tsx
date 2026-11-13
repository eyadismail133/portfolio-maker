import type { ReactElement } from "react";
import { dirOf, safeImageUrl } from "./i18n";
import { pageIcon } from "./page-meta";
import { Renderer } from "./Renderer";
import type { PortfolioDoc } from "./schema/document";
import type { Lang } from "./schema/primitives";
import { googleFontsUrl } from "./themes/fonts";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export type HtmlOptions = {
  lang?: Lang;
  /** The stylesheet text to put inside the page. */
  css?: string;
  /** Or a link to a separate stylesheet file. */
  cssHref?: string;
  /** The page script text to put inside the page. */
  script?: string;
  /** Or a link to a separate script file. */
  scriptHref?: string;
  languageHrefs?: Partial<Record<Lang, string>>;
  formAction?: string;
  /** The page's own address, for search engines and link previews. */
  canonical?: string;
  /** A share image to use when the owner has not chosen one. */
  fallbackShareImage?: string;
  /** Extra markup at the end of the page, written by our own code only (never by users). */
  trustedFooter?: string;
};

/**
 * A complete HTML file for a portfolio. `render` turns the page into markup; it is passed in
 * because Next.js route handlers must load react-dom/server only when they run.
 */
export function buildHtmlPage(
  render: (element: ReactElement) => string,
  doc: PortfolioDoc,
  options: HtmlOptions = {},
): string {
  const lang = options.lang ?? doc.meta.languages[0];
  const body = render(
    <Renderer
      doc={doc}
      lang={lang}
      fontLink={false}
      languageHrefs={options.languageHrefs}
      formAction={options.formAction}
      standalone
    />,
  );
  const style = options.cssHref
    ? `<link rel="stylesheet" href="${escapeHtml(options.cssHref)}">`
    : `<style>${(options.css ?? "").replace(/<\/style/gi, "<\\/style")}</style>`;
  const script = options.scriptHref
    ? `<script src="${escapeHtml(options.scriptHref)}" defer></script>`
    : options.script
      ? `<script>${options.script.replace(/<\/script/gi, "<\\/script")}</script>`
      : "";
  const alternates = Object.entries(options.languageHrefs ?? {})
    .map(([l, href]) => `<link rel="alternate" hreflang="${l}" href="${escapeHtml(href ?? "")}">`)
    .join("\n");
  const shareImage = safeImageUrl(doc.meta.shareImage?.url) ?? options.fallbackShareImage ?? null;
  const favicon = pageIcon(doc);
  return `<!doctype html>
<html lang="${lang}" dir="${dirOf(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(doc.meta.title)}</title>
<meta name="description" content="${escapeHtml(doc.meta.description)}">
<meta property="og:title" content="${escapeHtml(doc.meta.title)}">
<meta property="og:description" content="${escapeHtml(doc.meta.description)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="${shareImage ? "summary_large_image" : "summary"}">
${options.canonical ? `<link rel="canonical" href="${escapeHtml(options.canonical)}">\n<meta property="og:url" content="${escapeHtml(options.canonical)}">\n` : ""}${shareImage ? `<meta property="og:image" content="${escapeHtml(shareImage)}">\n` : ""}${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}">\n` : ""}${alternates ? `${alternates}\n` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escapeHtml(googleFontsUrl(doc.theme.fonts, doc.meta.languages))}">
<style>html{scroll-behavior:smooth}body{margin:0}</style>
${style}
</head>
<body>
${body}
${options.trustedFooter ?? ""}
${script}
</body>
</html>
`;
}

