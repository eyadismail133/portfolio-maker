import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

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

/** Without comments and empty lines, ending in one newline. */
export function minifyCss(css: string): string {
  return (
    css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\n\s*\n+/g, "\n")
      .trim() + "\n"
  );
}

/**
 * The stylesheet in the parts a page is built from: what every page needs before the sections
 * (base), one part per design family, one per section stylesheet (in the order of index.css),
 * and what every page needs after the sections (section style, personality, element styles).
 */
export type CssParts = {
  head: string;
  families: Record<string, string>;
  files: Record<string, string>;
  tail: string;
  /** For each section type, the section stylesheets it needs (its own and any it borrows from). */
  needs: Record<string, string[]>;
};

const SECTIONS_DIR = resolve("src/render-kit/sections");

/** Class names a source file can produce, including the start of names built at run time. */
function classTokens(source: string): Set<string> {
  return new Set(source.match(/pk-[a-z0-9_-]+/g) ?? []);
}

const PAGE_WIDE = new Set(["pk-root", "pk-section", "pk-container", "pk-js"]);

/**
 * Class names a stylesheet leads with: the first class of each selector after page-wide ones
 * (`.pk-root[...]`, `.pk-section[...]`). `.pk-dots { ... }` makes the file the home of
 * `.pk-dots`; `.pk-features__rows .pk-card` only styles a card inside its own block.
 */
function ownedClasses(css: string): Set<string> {
  const owned = new Set<string>();
  for (const rule of css.matchAll(/([^{}]+){/g)) {
    for (const selector of rule[1].split(",")) {
      const first = [...selector.matchAll(/.(pk-[a-z0-9_-]+)/g)]
        .map((m) => m[1])
        .find((c) => !PAGE_WIDE.has(c));
      if (first) owned.add(first);
    }
  }
  return owned;
}

function uses(tokens: Set<string>, name: string): boolean {
  if (tokens.has(name)) return true;
  // `pk-steps--${layout}` leaves the token "pk-steps--".
  for (const token of tokens) if (token.endsWith("-") && name.startsWith(token)) return true;
  return false;
}

export function cssParts(): CssParts {
  const index = resolve("src/render-kit/styles/index.css");
  const imports = [...readFileSync(index, "utf8").matchAll(/@import\s+"([^"]+)";/g)].map(
    (m) => m[1],
  );
  const head: string[] = [];
  const tail: string[] = [];
  const families: Record<string, string> = {};
  const files: Record<string, string> = {};
  for (const path of imports) {
    const file = resolve(dirname(index), path);
    const css = minifyCss(bundleCss(file));
    if (path.startsWith("./families/")) families[basename(path, ".css")] = css;
    else if (path.startsWith("../sections/"))
      files[relative(SECTIONS_DIR, file).replace(/\\/g, "/")] = css;
    else (Object.keys(files).length > 0 ? tail : head).push(css);
  }

  // Helpers every section draws with, and the helpers only some sections import.
  const shared = readFileSync(join(SECTIONS_DIR, "shared.tsx"), "utf8");
  const helpers: Record<string, string> = {
    entries: readFileSync(join(SECTIONS_DIR, "entries.tsx"), "utf8"),
    icons: readFileSync(join(SECTIONS_DIR, "icons.tsx"), "utf8"),
  };
  // A file is pulled in for the classes it leads with, except those the shared helpers draw on
  // every page. Pulling in a file too many only costs bytes; a missing one would break a page,
  // which the page-css test checks for every section and layout. Pulling in a file too many only costs bytes; a missing one would break a page.
  const everywhere = classTokens(shared);
  const defined = Object.fromEntries(
    Object.entries(files).map(([name, css]) => [
      name,
      new Set([...ownedClasses(css)].filter((c) => !everywhere.has(c))),
    ]),
  );

  const needs: Record<string, string[]> = {};
  for (const dir of readdirSync(SECTIONS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const folder = join(SECTIONS_DIR, dir.name);
    const sources = readdirSync(folder)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => readFileSync(join(folder, f), "utf8"))
      .join("\n");
    const type = sources.match(/type: "([a-z-]+)"/)?.[1];
    if (!type) continue;
    let text = sources + shared;
    for (const [helper, source] of Object.entries(helpers)) {
      if (sources.includes(`from "../${helper}"`)) text += source;
    }
    const tokens = classTokens(text);
    needs[type] = Object.keys(files).filter(
      (name) => name.startsWith(`${dir.name}/`) || [...defined[name]].some((c) => uses(tokens, c)),
    );
  }
  return { head: head.join(""), families, files, tail: tail.join(""), needs };
}

/** The source of src/render-kit/generated/page-css.ts. */
export function cssModule(): string {
  const parts = cssParts();
  return `// Made by scripts/build-css.ts from src/render-kit/styles. Do not edit by hand.
/** Rules every page needs before the sections. */
export const CSS_HEAD = ${JSON.stringify(parts.head)};
/** One part per design family. */
export const CSS_FAMILIES: Record<string, string> = ${JSON.stringify(parts.families, null, 1)};
/** One part per section stylesheet, in the order of styles/index.css. */
export const CSS_FILES: Record<string, string> = ${JSON.stringify(parts.files, null, 1)};
/** Rules every page needs after the sections. */
export const CSS_TAIL = ${JSON.stringify(parts.tail)};
/** The section stylesheets each section type needs. */
export const CSS_NEEDS: Record<string, string[]> = ${JSON.stringify(parts.needs)};
/** The whole stylesheet: what the editor and the tests use. */
export const PAGE_CSS =
  CSS_HEAD + Object.values(CSS_FAMILIES).join("") + Object.values(CSS_FILES).join("") + CSS_TAIL;
`;
}
