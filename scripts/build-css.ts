/**
 * Writes the whole render-kit stylesheet into src/render-kit/generated/page-css.ts, so the HTML
 * export and the published pages can use it as text. Runs before dev, build and test.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderKitCss } from "./bundle-css";

const target = resolve("src/render-kit/generated/page-css.ts");
const css = renderKitCss()
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\n\s*\n+/g, "\n")
  .trim();
const source = `// Made by scripts/build-css.ts from src/render-kit/styles. Do not edit by hand.\nexport const PAGE_CSS = ${JSON.stringify(css + "\n")};\n`;

let current = "";
try {
  current = readFileSync(target, "utf8");
} catch {
  // First run: the file does not exist yet.
}
if (current !== source) {
  mkdirSync(resolve("src/render-kit/generated"), { recursive: true });
  writeFileSync(target, source);
  console.log("Updated src/render-kit/generated/page-css.ts");
}
