import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/editor/ui";
import { SITE } from "@/lib/site";

/** Shared layout for the terms, privacy and refund pages: plain, readable, one column. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="group inline-flex items-center gap-2.5 font-semibold">
            <BrandMark size="sm" />
            <span>{SITE.name}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10">
        <div className="pm-card pm-animate-in rounded-3xl p-7 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated {SITE.policiesUpdated}</p>
          <div className="mt-8 grid max-w-[68ch] gap-4 leading-7 text-zinc-700 dark:text-zinc-300 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_ul]:list-disc [&_ul]:ps-6">
            {children}
          </div>
          <nav className="mt-12 flex flex-wrap gap-5 border-t border-zinc-200/80 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy
            </Link>
            <Link
              href="/refunds"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Refunds
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
