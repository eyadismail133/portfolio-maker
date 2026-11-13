import Link from "next/link";
import { BrandMark, primaryButtonClass } from "@/editor/ui";

export default function NotFound() {
  return (
    <main className="pm-aurora-bg flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="pm-card pm-animate-scale flex max-w-md flex-col items-center gap-4 rounded-3xl p-8">
        <BrandMark size="lg" />
        <h1 className="text-2xl font-bold tracking-tight">This page does not exist</h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The link may be mistyped, or the portfolio was taken offline by its owner.
        </p>
        <Link href="/" className={`${primaryButtonClass} mt-2 px-5 py-2.5`}>
          Go to Portfolio Maker
        </Link>
      </div>
    </main>
  );
}
