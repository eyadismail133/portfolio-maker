"use client";

import { useEffect, useRef, useState } from "react";
import { friendlyError } from "@/lib/portfolios";
import { publishChecks } from "@/lib/publish-checks";
import {
  getPublishState,
  isSlugAvailable,
  publish,
  unpublish,
  type PublishState,
} from "@/lib/publishing";
import { cleanSlugInput, slugProblem, suggestSlug } from "@/lib/slug";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { IconButton, Label, buttonClass, inputClass, primaryButtonClass } from "./ui";

type Availability = "unknown" | "checking" | "free" | "taken" | "mine";

/** Choose the link name, read the checklist, then publish, update or take the page offline. */
export function PublishDialog(props: {
  portfolioId: string;
  doc: PortfolioDoc;
  title: string;
  /** Saves pending edits first. */
  beforePublish: () => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<PublishState | null>(null);
  const [slug, setSlug] = useState("");
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const checks = publishChecks(props.doc);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const liveUrl = state?.status === "published" && state.slug ? `${origin}/p/${state.slug}` : "";

  useEffect(() => {
    ref.current?.showModal();
    getPublishState(props.portfolioId, props.doc)
      .then((found) => {
        setState(found);
        setSlug(found.slug ?? suggestSlug(props.title));
        setAvailability(found.slug ? "mine" : "unknown");
      })
      .catch((error) => setProblem(friendlyError(error)));
    // Only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check the link name shortly after typing stops.
  const shapeProblem = slug ? slugProblem(slug) : null;
  useEffect(() => {
    if (!state || !slug || shapeProblem) return;
    if (slug === state.slug) {
      Promise.resolve().then(() => setAvailability("mine"));
      return;
    }
    Promise.resolve().then(() => setAvailability("checking"));
    const timer = window.setTimeout(() => {
      isSlugAvailable(slug)
        .then((free) => setAvailability(free ? "free" : "taken"))
        .catch(() => setAvailability("unknown"));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [slug, shapeProblem, state]);

  useEffect(() => {
    if (!liveUrl) return;
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toDataURL(liveUrl, { margin: 1, width: 240 }))
      .then((url) => !cancelled && setQr(url))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [liveUrl]);

  const go = async () => {
    if (!state || shapeProblem || availability === "taken") return;
    setBusy(true);
    setProblem("");
    try {
      await props.beforePublish();
      const publishedAt = await publish(props.portfolioId, props.doc, slug, state.slug);
      setState({ status: "published", slug, publishedAt, changedSincePublish: false });
      setAvailability("mine");
    } catch (error) {
      if (error instanceof Error && error.message === "taken") {
        setAvailability("taken");
        setProblem("Someone else is already using this link name. Choose another.");
      } else setProblem(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const takeOffline = async () => {
    if (!state) return;
    setBusy(true);
    setProblem("");
    try {
      await unpublish(props.portfolioId, state.slug);
      setState({ ...state, status: "draft", changedSincePublish: false });
      setQr("");
    } catch (error) {
      setProblem(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setProblem("Copying is blocked in this browser. Select the link and copy it by hand.");
    }
  };

  const published = state?.status === "published";
  const slugChanged = published && slug !== state?.slug;
  const action = !published
    ? "Publish"
    : slugChanged
      ? "Publish at the new link"
      : state?.changedSincePublish
        ? "Update the live page"
        : "Publish again";

  return (
    <dialog
      ref={ref}
      onClose={props.onClose}
      aria-labelledby="publish-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 py-3 pe-3 ps-5 dark:border-zinc-800">
        <h2 id="publish-title" className="text-base font-semibold">
          {published ? "Your page is live" : "Publish your portfolio"}
        </h2>
        <IconButton icon="close" label="Close" onClick={() => ref.current?.close()} />
      </div>

      <div className="grid max-h-[75vh] gap-5 overflow-y-auto p-5">
        {!state && !problem && <p className="text-sm text-zinc-500">Checking your page…</p>}

        {published && liveUrl && (
          <div className="grid gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="break-all text-sm font-medium text-emerald-900 underline dark:text-emerald-100"
            >
              {liveUrl}
            </a>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={buttonClass} onClick={copy}>
                {copied ? "Link copied" : "Copy link"}
              </button>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                Open the page
              </a>
            </div>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- a generated QR code image
              <img
                src={qr}
                alt={`QR code for ${liveUrl}`}
                width={120}
                height={120}
                className="rounded border border-emerald-200 bg-white p-1"
              />
            )}
            {state?.changedSincePublish && (
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                You have changes that visitors do not see yet. Update the live page to show them.
              </p>
            )}
          </div>
        )}

        {state && (
          <div className="grid gap-1">
            <Label htmlFor="publish-slug">Link name</Label>
            <div
              className="flex items-center rounded-md border border-zinc-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 dark:border-zinc-700"
              dir="ltr"
            >
              <span className="ps-2.5 text-sm text-zinc-500">
                {origin.replace(/^https?:\/\//, "")}/p/
              </span>
              <input
                id="publish-slug"
                className={`${inputClass} border-0 ps-0.5 focus:ring-0`}
                value={slug}
                maxLength={50}
                spellCheck={false}
                onChange={(e) => setSlug(cleanSlugInput(e.target.value))}
                aria-describedby="publish-slug-note"
                aria-invalid={Boolean(shapeProblem) || availability === "taken"}
              />
            </div>
            <p
              id="publish-slug-note"
              className={`text-xs ${shapeProblem || availability === "taken" ? "text-red-600" : "text-zinc-500"}`}
            >
              {shapeProblem ??
                (availability === "taken"
                  ? "Someone else is already using this link name."
                  : availability === "checking"
                    ? "Checking…"
                    : availability === "free"
                      ? "This link name is free."
                      : slugChanged
                        ? "The old link will stop working."
                        : "Small letters, numbers and dashes.")}
            </p>
          </div>
        )}

        {state && (
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">
              {checks.length === 0 ? "Everything looks ready" : "Worth a look before publishing"}
            </h3>
            {checks.length > 0 && (
              <ul className="grid gap-2">
                {checks.map((check) => (
                  <li
                    key={check.id}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
                  >
                    {check.text}
                    {check.sections && (
                      <span className="mt-0.5 block text-xs opacity-80">
                        {check.sections.join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {checks.length > 0 && (
              <p className="text-xs text-zinc-500">
                These are suggestions. You can publish now and fix them later.
              </p>
            )}
          </div>
        )}

        {problem && (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-2.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}
      </div>

      {state && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          {published && (
            <button
              type="button"
              className={`${buttonClass} me-auto`}
              disabled={busy}
              onClick={takeOffline}
            >
              Take offline
            </button>
          )}
          <button
            type="button"
            className={`${primaryButtonClass} py-2 disabled:opacity-50`}
            disabled={
              busy ||
              Boolean(shapeProblem) ||
              !slug ||
              availability === "taken" ||
              availability === "checking"
            }
            onClick={go}
          >
            {busy ? "Publishing…" : action}
          </button>
        </div>
      )}
    </dialog>
  );
}
