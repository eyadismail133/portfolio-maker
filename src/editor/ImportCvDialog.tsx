"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { applyImport, importSummary, type CvImport } from "@/lib/ai/cv-import";
import { pdfText } from "@/lib/pdf-text";
import { useEditor } from "./store";
import { buttonClass, primaryButtonClass } from "./ui";

const MESSAGES: Record<string, string> = {
  pro: "Filling from a CV is part of the Pro plan.",
  limit: "You have used today's AI uses. It resets tomorrow.",
  busy: "The AI service is busy. Try again in a minute.",
  setup: "AI is not switched on for this site yet.",
  login: "Log in again to use this.",
  empty: "There is not enough text in this file. Paste the text of your CV instead.",
  model: "The CV could not be read. Try again, or paste the text instead.",
};

/**
 * Fills the page from a CV or a LinkedIn profile PDF ("More" → "Save to PDF" on LinkedIn). The
 * PDF is read in the browser; only its text is sent to the AI. The result is shown first and
 * applied as one step that Undo reverses.
 */
export function ImportCvDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState<CvImport | null>(null);
  const plan = useEditor((s) => s.plan);
  const lang = useEditor((s) => s.lang);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setProblem("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))
      return setProblem("Choose a PDF file, or paste the text below.");
    setBusy("Reading the PDF…");
    try {
      const found = await pdfText(file);
      if (found.length < 40)
        setProblem("No text was found in this PDF (it may be a scan). Paste the text instead.");
      setText(found);
    } catch {
      setProblem("This PDF could not be read. Paste the text instead.");
    } finally {
      setBusy("");
    }
  };

  const read = async () => {
    setProblem("");
    setBusy("Reading your CV… this takes up to half a minute.");
    try {
      const response = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: CvImport;
        error?: string;
      };
      if (!response.ok || !body.data)
        throw new Error(MESSAGES[body.error ?? "model"] ?? MESSAGES.model);
      if (importSummary(body.data).length === 0) throw new Error(MESSAGES.model);
      setResult(body.data);
    } catch (error) {
      setProblem(error instanceof Error && error.message ? error.message : MESSAGES.model);
    } finally {
      setBusy("");
    }
  };

  const apply = () => {
    if (!result) return;
    const { doc, commit } = useEditor.getState();
    if (doc) commit(applyImport(doc, result, lang));
    dialog.current?.close();
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="import-title"
      className="m-auto w-[min(560px,calc(100vw-24px))] rounded-2xl border border-zinc-200/80 bg-white/95 p-6 text-zinc-900 shadow-2xl backdrop-blur-xl backdrop:bg-black/45 dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100"
    >
      <h2 id="import-title" className="text-base font-bold tracking-tight">
        Fill the page from your CV
      </h2>
      {plan !== "pro" ? (
        <div className="mt-3 text-sm">
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
            {MESSAGES.pro} It reads a CV or LinkedIn PDF and fills your experience, education,
            skills and languages.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/pro" className={primaryButtonClass}>
              See Pro
            </Link>
            <button type="button" className={buttonClass} onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>
        </div>
      ) : result ? (
        <div className="mt-3 text-sm">
          <p className="font-medium">Found in your CV:</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-zinc-700 dark:text-zinc-300">
            {importSummary(result).map((part) => (
              <li key={part}>{part}</li>
            ))}
          </ul>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {lang === "ar"
              ? "These replace the matching sections (Arabic text); missing sections are added. Undo puts everything back."
              : "These replace the matching sections (English text); missing sections are added. Undo puts everything back."}
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className={primaryButtonClass} onClick={apply}>
              Fill my page
            </button>
            <button type="button" className={buttonClass} onClick={() => setResult(null)}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3.5 text-sm">
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
            Choose your CV as a PDF, or your LinkedIn profile saved as PDF (on your profile: More,
            then Save to PDF). The file stays on your device; only its text is read.
          </p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            aria-label="CV or LinkedIn PDF"
            className="text-sm file:me-3 file:cursor-pointer file:rounded-lg file:border file:border-zinc-300/90 file:bg-white file:px-3 file:py-1.5 file:font-medium file:shadow-2xs file:transition-colors hover:file:bg-zinc-50 dark:file:border-zinc-700 dark:file:bg-zinc-900 dark:hover:file:bg-zinc-800"
            onChange={(e) => readFile(e.target.files?.[0])}
          />
          <label className="grid gap-1.5">
            <span className="font-medium">Or paste the text</span>
            <textarea
              dir="auto"
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-xl border border-zinc-300/90 bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700/90 dark:bg-zinc-950"
            />
          </label>
          {busy && (
            <p role="status" className="text-zinc-600 dark:text-zinc-400">
              {busy}
            </p>
          )}
          {problem && (
            <p role="alert" className="text-red-700 dark:text-red-400">
              {problem}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy !== "" || text.trim().length < 40}
              onClick={read}
            >
              Read my CV (1 AI use)
            </button>
            <button type="button" className={buttonClass} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
