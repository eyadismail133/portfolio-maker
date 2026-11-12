import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Joins a CSS file with everything it imports. */
export function bundleCss(file: string): string {
  return readFileSync(file, "utf8").replace(/@import\s+"([^"]+)";/g, (_, path: string) =>
    bundleCss(resolve(dirname(file), path)),
  );
}

/** The whole render-kit stylesheet as one string. */
export function renderKitCss(): string {
  return bundleCss(resolve("src/render-kit/styles/index.css"));
}
