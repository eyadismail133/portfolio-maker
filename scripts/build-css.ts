/**
 * Writes the render-kit stylesheet, in parts, into src/render-kit/generated/page-css.ts, so the
 * HTML export and the published pages can use it as text and carry only what a page uses
 * (`render-kit/page-css.ts`). Runs before dev, build and test.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cssModule } from "./bundle-css";

const target = resolve("src/render-kit/generated/page-css.ts");
const source = cssModule();

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
