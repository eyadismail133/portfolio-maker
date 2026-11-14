"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark, buttonClass, primaryButtonClass, UiIcon } from "@/editor/ui";
import { readAnswers, writePending } from "@/lib/local-drafts";
import { addStoredPicture } from "@/lib/picture-store";
import { createPortfolio, friendlyError, saveOnboardingAnswers } from "@/lib/portfolios";
import { createClient } from "@/lib/supabase/client";
import { blankStart, generateIdeas } from "@/recommend/generate";
import { EMPTY_ANSWERS, type Answers } from "@/recommend/types";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { MiniPreview } from "./MiniPreview";
import { TiltCard } from "./TiltCard";

/** Six starter portfolios made from the onboarding answers. Choosing one opens it in the editor. */
export function Ideas() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [seed, setSeed] = useState(0);
  const [busy, setBusy] = useState("");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    const saved = readAnswers();
    if (!saved || typeof saved !== "object") {
      router.replace("/new");
      return;
    }
    Promise.resolve().then(() => setAnswers({ ...EMPTY_ANSWERS, ...(saved as Partial<Answers>) }));
  }, [router]);

  const ideas = useMemo(() => (answers ? generateIdeas(answers, seed) : []), [answers, seed]);

  /** Saves the chosen start to the account, or keeps it for after login when there is none. */
  const use = async (key: string, doc: PortfolioDoc) => {
    if (!answers) return;
    setBusy(key);
    setProblem("");
    const title = doc.meta.title || answers.name || "My portfolio";
    try {
      let signedIn = false;
      try {
        signedIn = Boolean((await createClient().auth.getClaims()).data?.claims?.sub);
      } catch {
        // Without a working account service, carry on as a visitor.
      }
      if (!signedIn) {
        writePending({ doc, title, answers });
        router.push("/signup");
        return;
      }
      const id = await createPortfolio(await addStoredPicture(doc), title);
      await saveOnboardingAnswers(answers, id);
      router.push(`/editor/${id}`);
    } catch (error) {
      setProblem(friendlyError(error));
      setBusy("");
    }
  };

  if (!answers)
    return (
      <div className="pm-aurora-bg flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Preparing your ideas…
      </div>
    );

  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div aria-hidden="true" className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10" />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="group inline-flex items-center gap-2.5 text-sm font-semibold">
            <BrandMark size="sm" />
            <span className="hidden sm:inline">Portfolio Maker</span>
          </Link>
          <Link href="/new" className={`${buttonClass} ms-auto`}>
            Change my answers
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8">
        <div className="pm-animate-in">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Six ways to start</h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
            Each one already has your name, sections for your goal and sample text for your field.
            Pick the closest; everything can be changed in the editor.
          </p>
        </div>
        {problem && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea, idx) => (
            <TiltCard
              key={`${seed}-${idea.id}`}
              style={{ animationDelay: `${idx * 65}ms` }}
              className="pm-animate-in pm-card-interactive group flex flex-col overflow-hidden rounded-2xl p-2"
            >
              <div aria-hidden="true" className="mb-2 flex items-center gap-1.5 px-2 pt-1">
                <span className="size-2 rounded-full bg-rose-400/80" />
                <span className="size-2 rounded-full bg-amber-400/80" />
                <span className="size-2 rounded-full bg-emerald-400/80" />
                <span
                  data-no-translate
                  className="ms-2 truncate rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-500"
                >
                  {idea.doc.theme.family}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                  <MiniPreview doc={idea.doc} />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3.5 p-3.5 pt-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{idea.name}</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {idea.note}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy !== ""}
                  className={`${primaryButtonClass} mt-auto py-2.5 disabled:opacity-60`}
                  onClick={() => use(idea.id, idea.doc)}
                >
                  <span>{busy === idea.id ? "Opening…" : "Use this"}</span>
                  {busy !== idea.id && (
                    <UiIcon name="arrowRight" size={14} className="rtl:rotate-180" />
                  )}
                </button>
              </div>
            </TiltCard>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            className={`${buttonClass} px-4 py-2.5`}
            onClick={() => setSeed(seed + 1)}
          >
            <UiIcon name="shuffle" size={15} />
            <span>Show me six more</span>
          </button>
          <button
            type="button"
            disabled={busy !== ""}
            className={`${buttonClass} px-4 py-2.5`}
            onClick={() => use("blank", blankStart(answers))}
          >
            {busy === "blank" ? "Opening…" : "Start from a blank page"}
          </button>
        </div>
      </main>
    </div>
  );
}
