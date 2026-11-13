import type { Metadata } from "next";
import Link from "next/link";
import { TemplateGallery } from "@/components/TemplateGallery";
import { TEMPLATES } from "@/lib/templates";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";

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
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <Link href="/" className="font-semibold">
          Portfolio Maker
        </Link>
        <UiLanguageSwitch className="ms-auto" />
        <Link
          href="/new"
          className=" rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Start free
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Portfolio templates</h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {TEMPLATES.length} designs for personal portfolios, company pages and startup launches.
          Each one works in English and Arabic, on phones and computers, and can be changed down to
          the last color. Open one in the editor without an account.
        </p>
        <TemplateGallery />
        <section className="mt-16 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            How the templates work
          </h2>
          <p className="mt-2">
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
