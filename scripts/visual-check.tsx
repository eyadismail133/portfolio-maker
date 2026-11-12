/**
 * Opens every section in every design family in a real browser, in English and Arabic, on a
 * phone and a desktop screen, in both sets of layouts. Fails if a page scrolls sideways or a
 * section comes out empty, and saves screenshots to ./screenshots for a human to look at.
 *
 *   npm run visual               one full-page screenshot per page
 *   npm run visual -- --sections also one screenshot per section
 *
 * First use on a new computer: npx playwright install chromium
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { renderToHtml } from "../src/render-kit/export";
import { createSampleDoc } from "../src/render-kit/samples";
import { families } from "../src/render-kit/themes/families";
import { renderKitCss } from "./bundle-css";

const perSection = process.argv.includes("--sections");
const css = renderKitCss();
const out = resolve("screenshots");
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
          await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
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
