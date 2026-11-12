"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { inputClass, Label, primaryButtonClass } from "@/editor/ui";

const REASONS = [
  ["spam", "Spam or advertising"],
  ["scam", "A scam, or it asks for passwords or payment details"],
  ["stolen", "It uses my work or my name without permission"],
  ["personal", "It shares someone's private information"],
  ["offensive", "Hateful, violent or sexual content"],
  ["other", "Something else"],
] as const;

/** Lets a visitor tell the site owner about a published page that breaks the rules. */
export function ReportForm() {
  const slug = useSearchParams().get("page") ?? "";
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [problem, setProblem] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug,
        reason,
        details,
        email,
        website: new FormData(event.currentTarget).get("website"),
      }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (body?.ok) return setState("sent");
    setProblem(
      body?.error === "not_found"
        ? "That page is not online any more, so there is nothing to report."
        : body?.error === "busy"
          ? "This page has had many reports in the last hour. Try again later."
          : "The report could not be sent. Try again.",
    );
    setState("error");
  };

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-12">
      <Link href="/" className="text-sm font-semibold">
        Portfolio Maker
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Report a page</h1>
      {slug && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400" dir="ltr">
          /p/{slug}
        </p>
      )}
      {state === "sent" ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
        >
          Thank you. We will look at this page.
        </p>
      ) : !slug ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Open this form from the &quot;Report this page&quot; link at the bottom of the page you
          want to report.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">What is wrong with it?</legend>
            {REASONS.map(([value, label]) => (
              <label key={value} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  required
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="mt-1"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="grid gap-1">
            <Label htmlFor="report-details">Details (optional)</Label>
            <textarea
              id="report-details"
              rows={4}
              maxLength={2000}
              dir="auto"
              className={inputClass}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="report-email">Your email, if we may contact you (optional)</Label>
            <input
              id="report-email"
              type="email"
              dir="ltr"
              maxLength={200}
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="sr-only" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          {state === "error" && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {problem}
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending"}
            className={`${primaryButtonClass} justify-self-start px-4 py-2`}
          >
            {state === "sending" ? "Sending…" : "Send report"}
          </button>
        </form>
      )}
    </main>
  );
}
