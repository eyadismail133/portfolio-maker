import { zipSync, strToU8 } from "fflate";
import { renderToStaticMarkup } from "react-dom/server";
import { buildHtmlPage, type HtmlOptions } from "./html-page";
import type { PortfolioDoc } from "./schema/document";
import type { AssetRef, Lang } from "./schema/primitives";

export type { HtmlOptions };

/** A complete HTML file for a portfolio. */
export function renderToHtml(doc: PortfolioDoc, options: HtmlOptions = {}): string {
  return buildHtmlPage(renderToStaticMarkup, doc, options);
}

function isAsset(value: unknown): value is AssetRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AssetRef).url === "string" &&
    typeof (value as AssetRef).assetId === "string"
  );
}

/** Every image a document uses, wherever it sits. */
export function collectImageUrls(value: unknown, found = new Set<string>()): Set<string> {
  if (isAsset(value)) {
    if (/^https?:\/\//i.test(value.url)) found.add(value.url);
  } else if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, found);
  } else if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) collectImageUrls(item, found);
  }
  return found;
}

/** A copy of the document with image addresses swapped, for example to files next to the page. */
export function replaceImageUrls<T>(value: T, swap: Map<string, string>): T {
  if (isAsset(value)) {
    const next = swap.get(value.url);
    return (next ? { ...value, url: next } : value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => replaceImageUrls(item, swap)) as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceImageUrls(item, swap)]),
    ) as T;
  }
  return value;
}

/** File name of the page for each language: the first language is index.html. */
export function pageFileNames(languages: readonly Lang[]): Partial<Record<Lang, string>> {
  return Object.fromEntries(languages.map((l, i) => [l, i === 0 ? "index.html" : `${l}.html`]));
}

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export type ImageFetcher = (url: string) => Promise<{ bytes: Uint8Array; type: string } | null>;

export type ExportResult = {
  zip: Uint8Array;
  files: string[];
  /** Images that could not be downloaded; the page keeps linking to them online. */
  missingImages: string[];
};

/**
 * Everything a portfolio needs to work as a plain website: one HTML file per language, the
 * stylesheet, the page script and the images. Opening index.html works without internet, apart
 * from web fonts and images that could not be downloaded.
 */
export async function buildExportZip(
  doc: PortfolioDoc,
  assets: { css: string; script: string; fetchImage: ImageFetcher },
): Promise<ExportResult> {
  const files: Record<string, Uint8Array> = {};
  const swap = new Map<string, string>();
  const missingImages: string[] = [];
  let n = 0;
  for (const url of collectImageUrls(doc)) {
    let image: Awaited<ReturnType<ImageFetcher>> = null;
    try {
      image = await assets.fetchImage(url);
    } catch {
      image = null;
    }
    const extension = image && EXTENSIONS[image.type.split(";")[0].trim()];
    if (!image || !extension) {
      missingImages.push(url);
      continue;
    }
    n += 1;
    const name = `images/${n}.${extension}`;
    files[name] = image.bytes;
    swap.set(url, name);
  }

  const local = replaceImageUrls(doc, swap);
  const names = pageFileNames(local.meta.languages);
  for (const lang of local.meta.languages) {
    const html = renderToHtml(local, {
      lang,
      cssHref: "styles.css",
      scriptHref: "script.js",
      languageHrefs: local.meta.languages.length > 1 ? names : undefined,
    });
    files[names[lang]!] = strToU8(html);
  }
  files["styles.css"] = strToU8(assets.css);
  files["script.js"] = strToU8(assets.script);
  files["README.txt"] = strToU8(
    [
      `${doc.meta.title || "Portfolio"}`,
      "",
      "Open index.html in a browser to see the page.",
      "To put it online, upload every file in this folder, keeping the folder structure,",
      "to any static web host (for example Netlify, GitHub Pages or your own server).",
      "",
      "The contact form opens the visitor's email program in this version. Published pages on",
      "Portfolio Maker deliver messages to your inbox instead.",
      missingImages.length > 0
        ? `\n${missingImages.length} image(s) could not be downloaded and are still loaded from the internet.`
        : "",
    ].join("\n"),
  );
  return { zip: zipSync(files, { level: 6 }), files: Object.keys(files).sort(), missingImages };
}
