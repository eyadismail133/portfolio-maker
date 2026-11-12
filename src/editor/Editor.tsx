"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearUnsynced,
  readDraft,
  readUnsynced,
  writeDraft,
  writeUnsynced,
} from "@/lib/local-drafts";
import { friendlyError, getMyPlan, getPortfolio, isOffline, savePortfolio } from "@/lib/portfolios";
import { uploadImage } from "@/lib/upload";
import { createSampleDoc, type SampleKind } from "@/render-kit/samples";
import { downloadHtml } from "@/lib/export-download";
import { DesignPanel, SectionsPanel, SettingsPanel } from "./panels";
import { PublishDialog } from "./PublishDialog";
import { VersionsPanel } from "./VersionsPanel";
import type { FromPreview, ToPreview } from "./PreviewFrame";
import { SectionEditor } from "./SectionEditor";
import { useEditor, type Device } from "./store";
import { IconButton, Segmented, buttonClass, inputClass, primaryButtonClass } from "./ui";

const LOCAL_SAVE_DELAY_MS = 600;
const REMOTE_SAVE_DELAY_MS = 1500;
const RETRY_MS = 15000;
const WIDTHS: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };

type LeftTab = "sections" | "design" | "settings";
type SaveStatus = "saved" | "offline" | "conflict" | "failed";
type Opening =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "problem"; message: string; missing?: boolean };

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Saved",
  offline: "Offline. Changes are kept on this device and will sync when you are back online.",
  conflict: "This portfolio was changed in another tab or device.",
  failed: "Could not save. Trying again shortly.",
};

/**
 * The editor: sections and design on the left, live preview in the middle, section form on the
 * right. With a `portfolioId` it edits a saved portfolio; without one it edits a draft kept in
 * this browser, so people can try it before creating an account.
 */
export function Editor({ portfolioId }: { portfolioId?: string }) {
  const doc = useEditor((s) => s.doc);
  const selectedId = useEditor((s) => s.selectedId);
  const lang = useEditor((s) => s.lang);
  const device = useEditor((s) => s.device);
  const revision = useEditor((s) => s.revision);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { load, undo, redo, select, setLang, setDevice } = useEditor.getState();

  const [opening, setOpening] = useState<Opening>({ state: "loading" });
  const [tab, setTab] = useState<LeftTab>("sections");
  const [title, setTitle] = useState("");
  const [savedRevision, setSavedRevision] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);
  const titleRef = useRef("");
  const saver = useRef({ known: "", inFlight: false, queued: false, conflict: false });

  // Open the draft or the saved portfolio.
  useEffect(() => {
    let cancelled = false;
    if (!portfolioId) {
      useEditor.setState({ uploader: null, plan: null });
      load(readDraft() ?? createSampleDoc());
      Promise.resolve().then(() => !cancelled && setOpening({ state: "ready" }));
      return () => {
        cancelled = true;
      };
    }
    useEditor.setState({ uploader: (file) => uploadImage(file, portfolioId), plan: null });
    getMyPlan()
      .then((plan) => !cancelled && useEditor.setState({ plan }))
      .catch(() => undefined);
    getPortfolio(portfolioId)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setOpening({
            state: "problem",
            missing: true,
            message: "This portfolio does not exist, or it belongs to another account.",
          });
          return;
        }
        saver.current = { known: found.updatedAt, inFlight: false, queued: false, conflict: false };
        titleRef.current = found.title;
        setTitle(found.title);
        const unsynced = readUnsynced(portfolioId, found.updatedAt);
        load(unsynced ?? found.doc);
        // Edits that never reached the server are saved now.
        if (unsynced) useEditor.setState({ revision: 1 });
        else clearUnsynced(portfolioId);
        setOpening({ state: "ready" });
      })
      .catch(
        (error) => !cancelled && setOpening({ state: "problem", message: friendlyError(error) }),
      );
    return () => {
      cancelled = true;
    };
  }, [portfolioId, load]);

  const send = useCallback((message: ToPreview) => {
    if (frameReady.current)
      frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // Keep the preview showing the current document.
  useEffect(() => {
    if (doc) send({ type: "pk:state", doc, lang, selectedId });
  }, [doc, lang, selectedId, send]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<FromPreview>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (event.data?.type === "pk:ready") {
        frameReady.current = true;
        const state = useEditor.getState();
        if (state.doc)
          send({
            type: "pk:state",
            doc: state.doc,
            lang: state.lang,
            selectedId: state.selectedId,
          });
      }
      if (event.data?.type === "pk:select") select(event.data.id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [select, send]);

  /** Sends the current document to the server. Only one save runs at a time. */
  const flush = useCallback(async () => {
    const job = saver.current;
    if (!portfolioId || job.conflict) return;
    if (job.inFlight) {
      job.queued = true;
      return;
    }
    const { doc: current, revision: sending } = useEditor.getState();
    if (!current) return;
    job.inFlight = true;
    try {
      const next = await savePortfolio(
        portfolioId,
        { doc: current, title: titleRef.current },
        job.known,
      );
      if (next === null) {
        job.conflict = true;
        setStatus("conflict");
        return;
      }
      job.known = next;
      const latest = useEditor.getState();
      if (latest.revision === sending) clearUnsynced(portfolioId);
      else if (latest.doc) writeUnsynced(portfolioId, latest.doc, next);
      setSavedRevision(sending);
      setStatus("saved");
    } catch (error) {
      setStatus(isOffline(error) ? "offline" : "failed");
    } finally {
      job.inFlight = false;
      if (job.queued) {
        job.queued = false;
        void flush();
      }
    }
  }, [portfolioId]);

  // Save shortly after the last change: in the browser for a draft, on the server for a portfolio.
  useEffect(() => {
    if (revision === 0 || opening.state !== "ready") return;
    const current = useEditor.getState().doc;
    if (!current) return;
    if (!portfolioId) {
      const timer = window.setTimeout(() => {
        setStatus(writeDraft(current) ? "saved" : "failed");
        setSavedRevision(revision);
      }, LOCAL_SAVE_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    // Keep a copy on this device right away, so closing the tab loses nothing.
    writeUnsynced(portfolioId, current, saver.current.known);
    const timer = window.setTimeout(() => void flush(), REMOTE_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [revision, portfolioId, opening.state, flush]);

  // While a save has not gone through, try again when the connection returns and every few seconds.
  useEffect(() => {
    if (!portfolioId || (status !== "offline" && status !== "failed")) return;
    const retry = () => void flush();
    window.addEventListener("online", retry);
    const timer = window.setInterval(retry, RETRY_MS);
    return () => {
      window.removeEventListener("online", retry);
      window.clearInterval(timer);
    };
  }, [status, portfolioId, flush]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "s") {
        event.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, flush]);

  if (opening.state === "problem") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-zinc-700 dark:text-zinc-300">{opening.message}</p>
        <div className="flex gap-2">
          {!opening.missing && (
            <button type="button" className={buttonClass} onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
          <Link href="/dashboard" className={primaryButtonClass}>
            Back to my portfolios
          </Link>
        </div>
      </div>
    );
  }
  if (opening.state === "loading" || !doc) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-500">
        {portfolioId ? "Opening your portfolio…" : "Opening your draft…"}
      </div>
    );
  }

  const pick = (id: string) => {
    select(id);
    send({ type: "pk:scroll", id });
  };
  const startOver = (kind: SampleKind) => {
    load(createSampleDoc({ kind }));
    setSavedRevision(-1);
    useEditor.setState({ revision: 1 });
  };
  const rename = (next: string) => {
    setTitle(next);
    titleRef.current = next;
    useEditor.setState((s) => ({ revision: s.revision + 1 }));
  };
  const selected = doc.sections.find((s) => s.id === selectedId);
  const dirty = revision !== savedRevision && revision > 0;
  const statusText =
    status === "saved"
      ? dirty
        ? "Saving…"
        : portfolioId
          ? "Saved"
          : "Saved in this browser"
      : status === "failed" && !portfolioId
        ? "Could not save in this browser"
        : STATUS_TEXT[status];

  const download = async () => {
    if (useEditor.getState().plan !== "pro") {
      setExporting("Downloading the HTML is part of Pro.");
      return;
    }
    setExporting("Preparing the download…");
    try {
      const fileName = (title || doc.meta.title || "portfolio")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const { missingImages } = await downloadHtml(doc, fileName);
      setExporting(
        missingImages > 0
          ? `Downloaded. ${missingImages} image(s) still load from the internet.`
          : "",
      );
    } catch {
      setExporting("The download could not be prepared. Try again.");
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={portfolioId ? "/dashboard" : "/"}
          className="rounded px-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {portfolioId ? "← My portfolios" : "Portfolio Maker"}
        </Link>
        {portfolioId && (
          <input
            aria-label="Portfolio name"
            className={inputClass.replace("w-full", "w-56")}
            dir="auto"
            maxLength={120}
            value={title}
            onChange={(e) => rename(e.target.value)}
          />
        )}
        <span className="flex">
          <IconButton icon="undo" label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
          <IconButton icon="redo" label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo} />
        </span>
        <span
          role="status"
          className={`max-w-sm text-xs ${status === "saved" ? "text-zinc-500" : "font-medium text-amber-700 dark:text-amber-400"}`}
        >
          {statusText}
        </span>
        {exporting && (
          <span role="status" className="text-xs text-zinc-600 dark:text-zinc-400">
            {exporting}
            {exporting.endsWith("part of Pro.") && (
              <>
                {" "}
                <Link
                  href="/pro"
                  className="font-medium text-violet-700 underline dark:text-violet-300"
                >
                  See Pro
                </Link>
              </>
            )}
          </span>
        )}
        {status === "conflict" && (
          <button type="button" className={buttonClass} onClick={() => window.location.reload()}>
            Reload the latest version
          </button>
        )}
        <span className="ms-auto flex flex-wrap items-center gap-3">
          {doc.meta.languages.length > 1 && (
            <span className="w-40">
              <Segmented
                label="Language to edit"
                value={lang}
                onChange={setLang}
                options={doc.meta.languages.map(
                  (l) => [l, l === "en" ? "English" : "Arabic"] as const,
                )}
              />
            </span>
          )}
          <span className="flex" role="group" aria-label="Screen size">
            {(["desktop", "tablet", "phone"] as const).map((d) => (
              <IconButton
                key={d}
                icon={d}
                label={`${d.charAt(0).toUpperCase()}${d.slice(1)} size`}
                aria-pressed={device === d}
                className={
                  device === d
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                    : ""
                }
                onClick={() => setDevice(d)}
              />
            ))}
          </span>
          <button
            type="button"
            className={buttonClass}
            disabled={exporting === "Preparing the download…"}
            onClick={download}
          >
            Download HTML
          </button>
          {portfolioId && (
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => setPublishing(true)}
            >
              Publish
            </button>
          )}
          {!portfolioId && (
            <>
              <select
                aria-label="Start over from a sample"
                className={inputClass.replace("w-full", "w-44")}
                value=""
                onChange={(e) => e.target.value && startOver(e.target.value as SampleKind)}
              >
                <option value="">Start over from…</option>
                <option value="personal">Personal sample</option>
                <option value="company">Company sample</option>
                <option value="startup">Startup sample</option>
              </select>
              <Link href="/signup" className={primaryButtonClass}>
                Create account to keep it
              </Link>
            </>
          )}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-e border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
            <Segmented
              label="Panel"
              value={tab}
              onChange={setTab}
              options={[
                ["sections", "Sections"],
                ["design", "Design"],
                ["settings", "Settings"],
              ]}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === "sections" && <SectionsPanel doc={doc} onPick={pick} />}
            {tab === "design" && <DesignPanel doc={doc} />}
            {tab === "settings" && (
              <div className="grid gap-8">
                <SettingsPanel doc={doc} />
                {portfolioId && <VersionsPanel portfolioId={portfolioId} />}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 justify-center overflow-auto p-0 lg:p-4">
          <iframe
            ref={frame}
            title="Preview of your portfolio"
            src="/preview"
            className="h-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-800"
            style={{ width: WIDTHS[device], maxWidth: "100%" }}
          />
        </main>

        {publishing && portfolioId && (
          <PublishDialog
            portfolioId={portfolioId}
            doc={doc}
            title={title}
            beforePublish={flush}
            onClose={() => setPublishing(false)}
          />
        )}

        {selected && (
          <aside className="w-[340px] shrink-0 border-s border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <SectionEditor key={selected.id} section={selected} />
          </aside>
        )}
      </div>
    </div>
  );
}
