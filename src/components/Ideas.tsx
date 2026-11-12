"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buttonClass, primaryButtonClass } from "@/editor/ui";
import { readAnswers, writePending } from "@/lib/local-drafts";
import { addStoredPicture } from "@/lib/picture-store";
import { createPortfolio, friendlyError, saveOnboardingAnswers } from "@/lib/portfolios";
import { createClient } from "@/lib/supabase/client";
import { blankStart, generateIdeas } from "@/recommend/generate";
import { EMPTY_ANSWERS, type Answers } from "@/recommend/types";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { MiniPreview } from "./MiniPreview";

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
        signedIn = Boolean((await createClient().auth.getUser()).data.user);
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
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Preparing your ideas…
      </div>
    );

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center gap-4 px-5 py-4">
        <Link href="/" className="text-sm font-semibold">
          Portfolio Maker
        </Link>
        <Link href="/new" className={`${buttonClass} ms-auto`}>
          Change my answers
        </Link>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Six ways to start</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Each one already has your name, sections for your goal and sample text for your field.
          Pick the closest; everything can be changed in the editor.
        </p>
        {problem && (
          <p
            role="alert"
            className="mt-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}
        <ul className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <li
              key={`${seed}-${idea.id}`}
              className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <MiniPreview
                doc={idea.doc}
                className="border-b border-zinc-200 dark:border-zinc-800"
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h2 className="text-base font-semibold">{idea.name}</h2>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{idea.note}</p>
                </div>
                <button
                  type="button"
                  disabled={busy !== ""}
                  className={`${primaryButtonClass} mt-auto py-2 disabled:opacity-60`}
                  onClick={() => use(idea.id, idea.doc)}
                >
                  {busy === idea.id ? "Opening…" : "Use this"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className={`${buttonClass} px-4 py-2`}
            onClick={() => setSeed(seed + 1)}
          >
            Show me six more
          </button>
          <button
            type="button"
            disabled={busy !== ""}
            className={`${buttonClass} px-4 py-2`}
            onClick={() => use("blank", blankStart(answers))}
          >
            {busy === "blank" ? "Opening…" : "Start from a blank page"}
          </button>
        </div>
      </main>
    </div>
  );
}
