import type { Metadata } from "next";
import Link from "next/link";
import { TemplateGallery } from "@/components/TemplateGallery";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { BrandMark, UiIcon } from "@/editor/ui";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Portfolio templates in English and Arabic · Portfolio Maker",
  description:
    "Free portfolio and landing page templates for people, companies and startups: minimal, bold, elegant, classic CV, glass, gradient and more. Every one works in English and Arabic.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Portfolio templates in English and Arabic",
    description: "Twelve designs for personal portfolios, company pages and startup launches.",
  },
};

/** A public gallery of every design, for people searching for portfolio templates. */
export default function TemplatesPage() {
  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden="true"
        className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10"
      />
      <header className="pm-glass-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="group inline-flex items-center gap-2.5 font-semibold">
            <BrandMark />
            <span className="hidden text-base tracking-tight sm:inline">Portfolio Maker</span>
          </Link>
          <UiLanguageSwitch className="ms-auto" />
          <Link
            href="/new"
            className="pm-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            <span>Start free</span>
            <UiIcon name="arrowRight" size={14} className="rtl:rotate-180" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="pm-animate-in">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Portfolio templates</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {TEMPLATES.length} designs for personal portfolios, company pages and startup launches.
            Each one works in English and Arabic, on phones and computers, and can be changed down
            to the last color. Open one in the editor without an account.
          </p>
        </div>
        <TemplateGallery />
        <section className="pm-card mt-16 max-w-3xl rounded-2xl p-6 text-sm text-zinc-600 sm:p-8 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <UiIcon name="sparkles" size={16} />
            </span>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              How the templates work
            </h2>
          </div>
          <p className="mt-3 leading-relaxed">
            A template is a starting point: the sample text and pictures are there to show the
            layout. Replace them with your own, add or remove any of 43 sections, and switch to
            another design at any time without losing what you wrote. Publish to a free link, or
            download the page as HTML with Pro.
          </p>
        </section>
      </main>
    </div>
  );
}
