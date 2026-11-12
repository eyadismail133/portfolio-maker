import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublished } from "@/lib/published";
import { PAGE_SCRIPT } from "@/render-kit/page-script";
import { Renderer } from "@/render-kit/Renderer";
import { safeImageUrl } from "@/render-kit/i18n";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";

/** Address of the page in each of its languages: the first language has no suffix. */
export function languageHrefs(slug: string, languages: Lang[]): Partial<Record<Lang, string>> {
  return Object.fromEntries(
    languages.map((l, i) => [l, i === 0 ? `/p/${slug}` : `/p/${slug}/${l}`]),
  );
}

/** Which language a request asks for; null when the page does not have that language. */
function resolveLang(languages: Lang[], wanted?: string): Lang | null {
  if (!wanted) return languages[0];
  return languages.includes(wanted as Lang) && wanted !== languages[0] ? (wanted as Lang) : null;
}

export async function publishedMetadata(slug: string, wanted?: string): Promise<Metadata> {
  const found = await getPublished(slug);
  if (!found) return { title: "Page not found", robots: { index: false } };
  const lang = resolveLang(found.doc.meta.languages, wanted);
  const { meta } = found.doc;
  const image = safeImageUrl(meta.shareImage?.url);
  const favicon = safeImageUrl(meta.favicon?.url);
  return {
    title: { absolute: meta.title || found.title },
    description: meta.description || undefined,
    alternates:
      meta.languages.length > 1 ? { languages: languageHrefs(slug, meta.languages) } : undefined,
    openGraph: {
      title: meta.title || found.title,
      description: meta.description || undefined,
      type: "website",
      locale: lang === "ar" ? "ar_EG" : "en_US",
      images: image ? [image] : undefined,
    },
    icons: favicon ? { icon: favicon } : undefined,
  };
}

/** A published portfolio as visitors see it. */
export async function PublishedPage({ slug, wanted }: { slug: string; wanted?: string }) {
  const found = await getPublished(slug);
  if (!found) notFound();
  const lang = resolveLang(found.doc.meta.languages, wanted);
  if (!lang) notFound();
  const counter = `navigator.sendBeacon&&navigator.sendBeacon(${JSON.stringify(`/api/view?slug=${slug}`)})`;
  return (
    <>
      <Renderer
        doc={found.doc}
        lang={lang}
        languageHrefs={
          found.doc.meta.languages.length > 1
            ? languageHrefs(slug, found.doc.meta.languages)
            : undefined
        }
        formAction={`/api/contact?slug=${slug}`}
      />
      {found.showBadge && (
        <Link
          href="/"
          className="fixed bottom-3 end-3 z-50 rounded-full bg-zinc-900/85 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Made with Portfolio Maker
        </Link>
      )}
      <p className="bg-white py-3 text-center text-xs text-zinc-500 dark:bg-zinc-950">
        <Link href={`/report?page=${slug}`} rel="nofollow" className="hover:underline">
          Report this page
        </Link>
      </p>
      <script dangerouslySetInnerHTML={{ __html: PAGE_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: counter }} />
    </>
  );
}
