import { renderToStaticMarkup } from "react-dom/server";
import { dirOf } from "./i18n";
import { Renderer } from "./Renderer";
import type { PortfolioDoc } from "./schema/document";
import type { Lang } from "./schema/primitives";
import { googleFontsUrl } from "./themes/fonts";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/**
 * A complete HTML file for a portfolio. `css` is the joined render-kit stylesheet; pass
 * `cssHref` instead to link a separate file.
 */
export function renderToHtml(
  doc: PortfolioDoc,
  options: { lang?: Lang; css?: string; cssHref?: string } = {},
): string {
  const lang = options.lang ?? doc.meta.languages[0];
  const body = renderToStaticMarkup(<Renderer doc={doc} lang={lang} fontLink={false} />);
  const style = options.cssHref
    ? `<link rel="stylesheet" href="${escapeHtml(options.cssHref)}">`
    : `<style>${(options.css ?? "").replace(/<\/style/gi, "<\\/style")}</style>`;
  return `<!doctype html>
<html lang="${lang}" dir="${dirOf(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(doc.meta.title)}</title>
<meta name="description" content="${escapeHtml(doc.meta.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escapeHtml(googleFontsUrl(doc.theme.fonts, doc.meta.languages))}">
<style>html{scroll-behavior:smooth}body{margin:0}</style>
${style}
</head>
<body>
${body}
</body>
</html>
`;
}
