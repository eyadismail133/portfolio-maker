/**
 * Opens every section in every design family in a real browser, in English and Arabic, on a
 * phone and a desktop screen, in both sets of layouts. Fails if a page scrolls sideways or a
 * section comes out empty, and saves screenshots to ./screenshots for a human to look at.
 *
 *   npm run visual               one full-page screenshot per page
 *   npm run visual -- --sections also one screenshot per section
 *   npm run visual -- --update   saves these screenshots as the good ones (./screenshots-baseline)
 *   npm run visual -- --compare  compares with the good ones; fails and saves a picture of the
 *                                differences (./screenshots/diff) when a page changed
 *
 * First use on a new computer: npx playwright install chromium
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { renderToHtml } from "../src/render-kit/export";
import { createSampleDoc } from "../src/render-kit/samples";
import { families } from "../src/render-kit/themes/families";
import { renderKitCss } from "./bundle-css";
import { difference } from "./png-diff";

const perSection = process.argv.includes("--sections");
const css = renderKitCss();
const out = resolve("screenshots");
const baseline = resolve("screenshots-baseline");
const update = process.argv.includes("--update");
const compare = process.argv.includes("--compare");
/** Share of pixels that may differ (anti-aliasing noise) before a page counts as changed. */
const TOLERANCE = 0.001;

const changes: string[] = [];
function checkAgainstBaseline(family: string, name: string, file: string) {
  const good = join(baseline, family, `${name}.png`);
  if (update) {
    mkdirSync(join(baseline, family), { recursive: true });
    copyFileSync(file, good);
    return;
  }
  if (!compare) return;
  if (!existsSync(good)) {
    changes.push(`${name}: no saved good screenshot (run with --update first)`);
    return;
  }
  const { share, picture } = difference(readFileSync(good), readFileSync(file));
  if (share > TOLERANCE) {
    changes.push(`${name}: ${(share * 100).toFixed(2)}% of the page changed`);
    if (picture) {
      mkdirSync(join(out, "diff"), { recursive: true });
      writeFileSync(join(out, "diff", `${name}.png`), picture);
    }
  }
}
const widths = { phone: 360, desktop: 1280 };
const problems: string[] = [];

async function main() {
  const browser = await chromium.launch();
  let pages = 0;

  for (const family of families) {
    for (const alternate of [false, true]) {
      const doc = createSampleDoc({ kind: "everything", family: family.id, alternate });
      for (const lang of ["en", "ar"] as const) {
        const html = renderToHtml(doc, { lang, css });
        for (const [device, width] of Object.entries(widths)) {
          const name = `${family.id}-${alternate ? "second" : "first"}-${lang}-${device}`;
          const page = await browser.newPage({ viewport: { width, height: 900 } });
          await page.setContent(html, { waitUntil: "domcontentloaded" });
          await page
            .evaluate(() =>
              Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]),
            )
            .catch(() => undefined);

          const report = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            empty: [...document.querySelectorAll<HTMLElement>(".pk-section")]
              .filter((el) => el.offsetHeight < 8 && !el.classList.contains("pk-divider"))
              .map((el) => el.id),
          }));
          if (report.overflow > 0)
            problems.push(`${name}: page is ${report.overflow}px wider than the screen`);
          for (const id of report.empty) problems.push(`${name}: section "${id}" is empty`);

          const dir = join(out, family.id);
          mkdirSync(dir, { recursive: true });
          const file = join(dir, `${name}.png`);
          await page.screenshot({ path: file, fullPage: true });
          checkAgainstBaseline(family.id, name, file);
          if (perSection) {
            const sectionDir = join(dir, name);
            mkdirSync(sectionDir, { recursive: true });
            for (const section of doc.sections) {
              const el = page.locator(`[id="${section.id}"]`);
              if ((await el.count()) === 1)
                await el.screenshot({ path: join(sectionDir, `${section.type}.png`) });
            }
          }
          await page.close();
          pages += 1;
        }
      }
    }
  }
  await browser.close();

  console.log(`Checked ${pages} pages. Screenshots are in ./screenshots`);
  if (update) console.log("Saved them as the good screenshots in ./screenshots-baseline.");
  if (compare && changes.length === 0) console.log("Every page matches its good screenshot.");
  if (changes.length > 0) {
    console.error(
      `\n${changes.length} page(s) look different (pictures in ./screenshots/diff):\n${changes.map((c) => `  - ${c}`).join("\n")}`,
    );
    process.exitCode = 1;
  }
  if (problems.length > 0) {
    console.error(
      `\n${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log("No layout problems found.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
