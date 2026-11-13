import type { NextRequest } from "next/server";
import { shareCard } from "@/lib/og-card";
import { getPublished } from "@/lib/published";
import { pickText } from "@/render-kit/i18n";
import type { Lang, LocalizedText } from "@/render-kit/schema/primitives";

/** The share image of a published page without one of its own: name, title and its colors. */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const found = await getPublished(slug);
  if (!found) return new Response("Not found", { status: 404 });
  const { doc } = found;
  const wanted = request.nextUrl.searchParams.get("lang") as Lang | null;
  const lang = wanted && doc.meta.languages.includes(wanted) ? wanted : doc.meta.languages[0];
  const hero = doc.sections.find((s) => s.type === "hero")?.content as
    Record<string, LocalizedText> | undefined;
  const name = pickText(hero?.name, lang) || doc.meta.title || found.title;
  const title = pickText(hero?.title, lang);
  const palette =
    doc.theme.mode === "dark" && doc.theme.paletteDark ? doc.theme.paletteDark : doc.theme.palette;
  return shareCard({
    title: name.slice(0, 60),
    subtitle: title.slice(0, 80) || undefined,
    footer: request.nextUrl.host,
    background: palette.background,
    text: palette.text,
    accent: palette.primary,
    rtl: lang === "ar",
  });
}
