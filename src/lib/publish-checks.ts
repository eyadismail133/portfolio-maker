import { FIELDS } from "@/recommend/content";
import { allSections, getSection } from "@/render-kit/registry";
import { COMPANY_CONTENT } from "@/render-kit/samples";
import type { PortfolioDoc } from "@/render-kit/schema/document";

/** Things worth fixing before publishing. They are warnings: people may publish anyway. */
export type Check = { id: string; text: string; sections?: string[] };

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) strings(item, out);
  else if (value && typeof value === "object")
    for (const item of Object.values(value)) strings(item, out);
  return out;
}

let samples: Set<string> | null = null;

/** Every sample sentence the app writes, in both languages. Short words like "Email" are left out. */
function sampleText(): Set<string> {
  if (samples) return samples;
  const all = [
    ...allSections().flatMap((def) => strings(def.defaults())),
    ...strings(COMPANY_CONTENT),
    ...FIELDS.flatMap((field) => strings({ ...field, id: "", skills: [] })),
  ];
  samples = new Set(all.filter((text) => text.length >= 24));
  return samples;
}

/** How many images in a value have no description. */
function imagesWithoutAlt(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce((sum: number, item) => sum + imagesWithoutAlt(item), 0);
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  if (typeof record.assetId === "string" && typeof record.url === "string") {
    return typeof record.alt === "string" && record.alt.trim() ? 0 : 1;
  }
  return Object.values(record).reduce((sum: number, item) => sum + imagesWithoutAlt(item), 0);
}

function hasContent(value: unknown): boolean {
  return strings(value).some((text) => text.trim().length > 0);
}

export function publishChecks(doc: PortfolioDoc): Check[] {
  const checks: Check[] = [];
  const visible = doc.sections.filter((s) => !s.hidden);
  const known = sampleText();
  const name = (type: string) => getSection(type)?.name ?? type;

  const withSamples = visible.filter((s) => strings(s.content).some((text) => known.has(text)));
  if (withSamples.length > 0) {
    checks.push({
      id: "sample-text",
      text: "Some sections still have sample text. Replace it with your own words.",
      sections: withSamples.map((s) => name(s.type)),
    });
  }

  const empty = visible.filter((s) => !hasContent(s.content));
  if (empty.length > 0) {
    checks.push({
      id: "empty",
      text: "Some sections are empty. Fill them in or hide them.",
      sections: empty.map((s) => name(s.type)),
    });
  }

  const noAlt = visible.filter((s) => imagesWithoutAlt(s.content) > 0);
  if (noAlt.length > 0) {
    checks.push({
      id: "alt",
      text: "Some images have no description for people who cannot see them.",
      sections: noAlt.map((s) => name(s.type)),
    });
  }

  const contactTypes = new Set(["contact", "newsletter", "social-links"]);
  const contactable =
    visible.some((s) => contactTypes.has(s.type)) ||
    visible.some((s) =>
      strings(s.content).some((text) => text.startsWith("mailto:") || text.startsWith("tel:")),
    );
  if (!contactable)
    checks.push({
      id: "contact",
      text: "Visitors have no way to contact you. Add a Contact section.",
    });

  if (!doc.meta.title.trim())
    checks.push({ id: "title", text: "The page has no title. Add one in Settings." });
  else if (
    doc.meta.title === "Layla Hassan, product designer" ||
    doc.meta.title === "Marsa, booking software for clinics"
  ) {
    checks.push({
      id: "title",
      text: "The page title is still the sample one. Change it in Settings.",
    });
  }

  if (doc.meta.languages.length > 1) {
    const [first, second] = doc.meta.languages;
    const untranslated = visible.filter(
      (s) =>
        strings(s.content).length > 0 &&
        JSON.stringify(s.content).includes(`"${first}":`) &&
        !JSON.stringify(s.content).includes(`"${second}":`),
    );
    if (untranslated.length > 0) {
      checks.push({
        id: "translation",
        text: `Some sections have no ${second === "ar" ? "Arabic" : "English"} text yet; visitors will see the other language there.`,
        sections: untranslated.map((s) => name(s.type)),
      });
    }
  }
  return checks;
}
