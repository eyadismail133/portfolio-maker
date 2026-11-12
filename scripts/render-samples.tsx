/**
 * Writes sample portfolios as plain HTML files into ./out-samples, to check the render kit
 * without running the app. Run with: npm run samples
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { renderToHtml } from "../src/render-kit/export";
import { createSampleDoc } from "../src/render-kit/samples";

/** Joins a CSS file with everything it imports. */
export function bundleCss(file: string): string {
  return readFileSync(file, "utf8").replace(/@import\s+"([^"]+)";/g, (_, path: string) =>
    bundleCss(resolve(dirname(file), path)),
  );
}

const css = bundleCss(resolve("src/render-kit/styles/index.css"));
const out = resolve("out-samples");
mkdirSync(out, { recursive: true });

const samples = {
  "personal-en": { doc: createSampleDoc(), lang: "en" },
  "personal-ar": { doc: createSampleDoc(), lang: "ar" },
  "personal-alt-en": {
    doc: createSampleDoc({ alternate: true, palette: "pine", fonts: "serif" }),
    lang: "en",
  },
  "personal-alt-ar": {
    doc: createSampleDoc({ alternate: true, palette: "ember", fonts: "geometric" }),
    lang: "ar",
  },
  "personal-dark-en": { doc: createSampleDoc({ mode: "dark", palette: "teal" }), lang: "en" },
} as const;

for (const [name, { doc, lang }] of Object.entries(samples)) {
  writeFileSync(join(out, `${name}.html`), renderToHtml(doc, { lang, css }));
  console.log(`wrote out-samples/${name}.html`);
}
