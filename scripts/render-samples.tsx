/**
 * Writes sample portfolios as plain HTML files into ./out-samples, to check the render kit
 * without running the app. Run with: npm run samples
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { renderToHtml } from "../src/render-kit/export";
import { createSampleDoc } from "../src/render-kit/samples";
import type { Lang, PortfolioDoc } from "../src/render-kit/schema";
import { families } from "../src/render-kit/themes/families";

/** Joins a CSS file with everything it imports. */
export function bundleCss(file: string): string {
  return readFileSync(file, "utf8").replace(/@import\s+"([^"]+)";/g, (_, path: string) =>
    bundleCss(resolve(dirname(file), path)),
  );
}

const css = bundleCss(resolve("src/render-kit/styles/index.css"));
const out = resolve("out-samples");
mkdirSync(out, { recursive: true });

const samples: Record<string, { doc: PortfolioDoc; lang: Lang }> = {
  "minimal-alt-en": {
    doc: createSampleDoc({ alternate: true, palette: "pine", fonts: "serif" }),
    lang: "en",
  },
  "minimal-dark-en": { doc: createSampleDoc({ mode: "dark" }), lang: "en" },
};
for (const [kind, family] of [
  ["company", "corporate"],
  ["startup", "tech"],
  ["everything", "minimal"],
  ["company", "bold"],
  ["startup", "creative"],
  ["company", "elegant"],
] as const) {
  samples[`${kind}-${family}-en`] = { doc: createSampleDoc({ kind, family }), lang: "en" };
  samples[`${kind}-${family}-ar`] = { doc: createSampleDoc({ kind, family }), lang: "ar" };
}
for (const family of families) {
  samples[`${family.id}-en`] = { doc: createSampleDoc({ family: family.id }), lang: "en" };
  samples[`${family.id}-ar`] = { doc: createSampleDoc({ family: family.id }), lang: "ar" };
}

for (const [name, { doc, lang }] of Object.entries(samples)) {
  writeFileSync(join(out, `${name}.html`), renderToHtml(doc, { lang, css }));
  console.log(`wrote out-samples/${name}.html`);
}
