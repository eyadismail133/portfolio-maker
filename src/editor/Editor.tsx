"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadHtml, openPreviewTab } from "@/lib/export-download";
import {
  clearUnsynced,
  readDraft,
  readUnsynced,
  writeDraft,
  writeUnsynced,
} from "@/lib/local-drafts";
import { friendlyError, getMyPlan, getPortfolio, isOffline, savePortfolio } from "@/lib/portfolios";
import { templateDoc } from "@/lib/templates";
import { uploadImage } from "@/lib/upload";
import { getSection } from "@/render-kit/registry";
import { createSampleDoc, type SampleKind } from "@/render-kit/samples";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { canMove } from "./doc-ops";
import { ImportCvDialog } from "./ImportCvDialog";
import { motion } from "motion/react";
import { ease } from "@/lib/motion";
import { DesignPanel, SectionsPanel, SettingsPanel } from "./panels";
import type { FromPreview, SectionAction, ToPreview } from "./PreviewFrame";
import { PublishDialog } from "./PublishDialog";
import { SectionEditor } from "./SectionEditor";
import { useEditor, type Device } from "./store";
import {
  BrandMark,
  buttonClass,
  IconButton,
  inputClass,
  primaryButtonClass,
  Segmented,
  UiIcon,
} from "./ui";
import { VersionsPanel } from "./VersionsPanel";

const LOCAL_SAVE_DELAY_MS = 600;
const REMOTE_SAVE_DELAY_MS = 1500;
const RETRY_MS = 15000;
const WIDTHS: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };

/** Which section toolbar buttons work for the selected section. */
function toolsFor(doc: PortfolioDoc, id: string | null) {
  const section = id ? doc.sections.find((s) => s.id === id) : undefined;
  if (!section) return { up: false, down: false, duplicate: false };
  return {
    up: canMove(doc, section.id, -1),
    down: canMove(doc, section.id, 1),
    duplicate: !getSection(section.type)?.pinned,
  };
}

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
  // The browser tab names the portfolio being edited.
  useEffect(() => {
    const name = title || "Draft";
    document.title = `${name} · Editor · Portfolio Maker`;
  }, [title]);
  const [savedRevision, setSavedRevision] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [publishing, setPublishing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exporting, setExporting] = useState("");
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  /** Full preview: both side panels hidden so the page gets the whole width. */
  const [focus, setFocus] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);
  const titleRef = useRef("");
  const saver = useRef({ known: "", inFlight: false, queued: false, conflict: false });

  // Open the draft or the saved portfolio.
  useEffect(() => {
    let cancelled = false;
    if (!portfolioId) {
      useEditor.setState({ uploader: null, plan: null });
      // A template chosen on /templates. Over an existing draft it is one step that Undo reverses.
      const params = new URLSearchParams(window.location.search);
      const chosen = templateDoc(params.get("template") ?? "");
      const draft = readDraft();
      load(draft ?? chosen ?? createSampleDoc());
      if (chosen) {
        if (draft) useEditor.getState().commit(chosen);
        window.history.replaceState(null, "", "/editor");
      }
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

  const sendRef = useRef<(message: ToPreview) => void>(() => undefined);
  const send = useCallback((message: ToPreview) => {
    if (frameReady.current)
      frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /** The section toolbar in the preview and the Delete and Ctrl+D keys. */
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const runAction = useCallback(
    (id: string, action: SectionAction) => {
      const state = useEditor.getState();
      if (action === "up") state.moveSection(id, -1);
      if (action === "down") state.moveSection(id, 1);
      if (action === "duplicate") state.duplicateSection(id);
      if (action === "delete") {
        state.removeSection(id);
        setNotice("Section deleted. Press Ctrl+Z to bring it back.");
        return;
      }
      // Keep the moved or copied section in view, so its toolbar stays at hand.
      const shown = useEditor.getState().selectedId ?? id;
      window.setTimeout(
        () => sendRef.current({ type: "pk:scroll", id: shown, block: "nearest" }),
        50,
      );
    },
    [setNotice],
  );

  // Keep the preview showing the current document.
  useEffect(() => {
    if (doc) send({ type: "pk:state", doc, lang, selectedId, tools: toolsFor(doc, selectedId) });
  }, [doc, lang, selectedId, send]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<FromPreview>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (event.data?.type === "pk:ready") {
        frameReady.current = true;
        const state = useEditor.getState();
        if (state.doc) {
          send({
            type: "pk:state",
            doc: state.doc,
            lang: state.lang,
            selectedId: state.selectedId,
            tools: toolsFor(state.doc, state.selectedId),
          });
        }
      }
      if (event.data?.type === "pk:select") select(event.data.id);
      if (event.data?.type === "pk:action") runAction(event.data.id, event.data.action);
      if (event.data?.type === "pk:edit") {
        useEditor.getState().setTextAt(event.data.id, event.data.path, event.data.text);
      }
      if (event.data?.type === "pk:note") setNotice(event.data.text);
      if (event.data?.type === "pk:key") {
        const { key, ctrl, shift } = event.data;
        window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: ctrl, shiftKey: shift }));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [select, send, runAction]);

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
      const typing = (event.target as HTMLElement | null)?.closest?.(
        "input, textarea, select, [contenteditable]",
      );
      if (event.key === "Escape") setFocus(false);
      const selected = useEditor.getState().selectedId;
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !typing &&
        selected &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        runAction(selected, "delete");
        return;
      }
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "d" && selected && !typing) {
        event.preventDefault();
        runAction(selected, "duplicate");
        return;
      }
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
  }, [undo, redo, flush, runAction]);

  if (opening.state === "problem") {
    return (
      <div className="pm-aurora-bg flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-zinc-700 dark:text-zinc-300">{opening.message}</p>
        <div className="flex gap-2.5">
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
      <div className="pm-aurora-bg flex h-dvh items-center justify-center text-sm text-zinc-500">
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
      <header className="pm-glass-header flex items-center gap-x-2.5 gap-y-2 overflow-x-auto px-3.5 py-2 lg:flex-wrap lg:overflow-visible [&>*]:shrink-0">
        <Link
          href={portfolioId ? "/dashboard" : "/"}
          className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-zinc-200/60 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800"
        >
          {!portfolioId && <BrandMark size="sm" />}
          {portfolioId ? (
            <>
              <span aria-hidden="true" className="inline-block rtl:rotate-180">
                ←
              </span>
              <span className="max-sm:sr-only">My portfolios</span>
            </>
          ) : (
            <span className="max-sm:sr-only">Portfolio Maker</span>
          )}
        </Link>
        {portfolioId && (
          <input
            aria-label="Portfolio name"
            className={inputClass.replace("w-full", "w-36 py-1.5 sm:w-52")}
            dir="auto"
            maxLength={120}
            value={title}
            onChange={(e) => rename(e.target.value)}
          />
        )}
        <button
          type="button"
          className={`${buttonClass} max-sm:hidden lg:hidden`}
          onClick={() => {
            select(null);
            setPanelOpen(true);
          }}
        >
          Sections and design
        </button>
        <span className="flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          <IconButton icon="undo" label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
          <IconButton icon="redo" label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo} />
        </span>
        <span
          role="status"
          className={`inline-flex max-w-sm items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
            status === "saved"
              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
              : "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${
              status === "saved"
                ? dirty
                  ? "animate-pulse bg-blue-500"
                  : "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          <span className="max-sm:sr-only">{statusText}</span>
        </span>
        {exporting && (
          <span role="status" className="text-xs text-zinc-600 dark:text-zinc-400">
            {exporting}
            {exporting.endsWith("part of Pro.") && (
              <>
                {" "}
                <Link
                  href="/pro"
                  className="font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
                >
                  See Pro
                </Link>
              </>
            )}
          </span>
        )}
        {notice && (
          <span
            role="status"
            className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
          >
            {notice}
          </span>
        )}
        {status === "conflict" && (
          <button type="button" className={buttonClass} onClick={() => window.location.reload()}>
            Reload the latest version
          </button>
        )}
        <span className="ms-auto flex items-center gap-2.5 lg:flex-wrap">
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
          <span
            className="hidden rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 lg:flex dark:border-zinc-800 dark:bg-zinc-900"
            role="group"
            aria-label="Screen size"
          >
            {(["desktop", "tablet", "phone"] as const).map((d) => (
              <IconButton
                key={d}
                icon={d}
                label={`${d.charAt(0).toUpperCase()}${d.slice(1)} size`}
                aria-pressed={device === d}
                className={
                  device === d
                    ? "bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-white"
                    : ""
                }
                onClick={() => setDevice(d)}
              />
            ))}
          </span>
          <span className="hidden items-center gap-1.5 lg:flex">
            <button
              type="button"
              aria-pressed={focus}
              className={buttonClass}
              title={focus ? "Show the side panels again (Esc)" : "Hide the side panels"}
              onClick={() => {
                setFocus((on) => !on);
                if (!focus) setNotice("Full preview. Press Esc or Show panels to edit again.");
              }}
            >
              <UiIcon name={focus ? "shrink" : "expand"} size={14} />
              {focus ? "Show panels" : "Full preview"}
            </button>
            <button
              type="button"
              className={buttonClass}
              title="See the page in a new tab, as visitors will"
              onClick={() => void openPreviewTab(doc, lang, window.open("", "_blank"))}
            >
              <UiIcon name="external" size={14} /> Open in new tab
            </button>
          </span>
          <span className="hidden items-center gap-2.5 lg:flex">
            <button
              type="button"
              className={buttonClass}
              disabled={exporting === "Preparing the download…"}
              onClick={download}
            >
              Download HTML
            </button>
            {portfolioId && (
              <button type="button" className={buttonClass} onClick={() => setImporting(true)}>
                Fill from CV
              </button>
            )}
            {portfolioId && (
              <Link href={`/editor/${portfolioId}/cv`} className={buttonClass}>
                PDF CV
              </Link>
            )}
          </span>
          {portfolioId && (
            <button
              type="button"
              className={`${primaryButtonClass} max-sm:hidden`}
              onClick={() => setPublishing(true)}
            >
              Publish
            </button>
          )}
          {!portfolioId && (
            <span className="hidden items-center gap-2.5 sm:flex">
              <select
                aria-label="Start over from a sample"
                className={inputClass.replace("w-full", "w-44 py-1.5")}
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
            </span>
          )}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {panelOpen && (
          <button
            type="button"
            aria-label="Close the panel"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}
        <aside
          className={`${panelOpen ? "fixed inset-y-0 start-0 z-40 flex shadow-2xl" : "hidden"} w-[min(20rem,88vw)] shrink-0 flex-col border-e border-zinc-200/80 bg-white lg:static lg:z-auto ${focus ? "lg:hidden" : "lg:flex"} lg:w-80 lg:shadow-none dark:border-zinc-800 dark:bg-zinc-900`}
        >
          <div className="border-b border-zinc-200/80 p-3 dark:border-zinc-800">
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
          <motion.div
            key={tab}
            className="min-h-0 flex-1 overflow-y-auto p-3.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            {tab === "sections" && (
              <SectionsPanel
                doc={doc}
                onPick={(id) => {
                  pick(id);
                  setPanelOpen(false);
                }}
              />
            )}
            {tab === "design" && <DesignPanel doc={doc} />}
            {tab === "settings" && (
              <div className="grid gap-8">
                <SettingsPanel doc={doc} />
                {portfolioId && <VersionsPanel portfolioId={portfolioId} />}
              </div>
            )}
          </motion.div>
        </aside>

        <main className="pm-dots-canvas flex min-w-0 flex-1 justify-center overflow-auto p-0 lg:p-5">
          <iframe
            ref={frame}
            title="Preview of your portfolio"
            src="/preview"
            className="h-full border border-zinc-200/90 bg-white shadow-xl transition-[width] duration-300 ease-out lg:rounded-xl dark:border-zinc-800"
            style={{ width: WIDTHS[device], maxWidth: "100%" }}
          />
        </main>

        {importing && <ImportCvDialog onClose={() => setImporting(false)} />}
        {publishing && portfolioId && (
          <PublishDialog
            portfolioId={portfolioId}
            doc={doc}
            title={title}
            beforePublish={flush}
            onClose={() => setPublishing(false)}
          />
        )}

        {selected && !focus && (
          <aside className="pm-animate-scale fixed inset-x-0 bottom-0 z-40 h-[70dvh] rounded-t-2xl border-t border-zinc-200/80 bg-white shadow-2xl lg:static lg:h-auto lg:w-[350px] lg:shrink-0 lg:rounded-none lg:border-s lg:border-t-0 lg:shadow-none dark:border-zinc-800 dark:bg-zinc-900">
            <SectionEditor key={selected.id} section={selected} />
          </aside>
        )}
      </div>

      {/* Phones: the main actions stay in reach at the bottom of the screen. */}
      <nav
        aria-label="Editor actions"
        className="pm-glass-header relative flex items-center gap-1.5 border-t border-zinc-200/80 px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden dark:border-zinc-800"
      >
        {moreOpen && (
          <>
            <button
              type="button"
              aria-label="Close the menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setMoreOpen(false)}
            />
            <div
              id="editor-more"
              className="pm-animate-scale absolute bottom-full end-2.5 z-40 mb-2 grid w-60 gap-1 rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <button
                type="button"
                className={menuItemClass}
                disabled={exporting === "Preparing the download…"}
                onClick={() => {
                  setMoreOpen(false);
                  download();
                }}
              >
                Download HTML
              </button>
              {portfolioId && (
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => {
                    setMoreOpen(false);
                    setImporting(true);
                  }}
                >
                  Fill from CV
                </button>
              )}
              {portfolioId && (
                <Link href={`/editor/${portfolioId}/cv`} className={menuItemClass}>
                  PDF CV
                </Link>
              )}
              {!portfolioId &&
                (["personal", "company", "startup"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={menuItemClass}
                    onClick={() => {
                      setMoreOpen(false);
                      startOver(kind);
                    }}
                  >
                    {kind === "personal"
                      ? "Start over from the personal sample"
                      : kind === "company"
                        ? "Start over from the company sample"
                        : "Start over from the startup sample"}
                  </button>
                ))}
            </div>
          </>
        )}
        {(["sections", "design"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`${buttonClass} flex-1 justify-center px-2`}
            onClick={() => {
              select(null);
              setTab(t);
              setPanelOpen(true);
            }}
          >
            {t === "sections" ? "Sections" : "Design"}
          </button>
        ))}
        <button
          type="button"
          className={`${buttonClass} flex-1 justify-center px-2`}
          aria-expanded={moreOpen}
          aria-controls="editor-more"
          onClick={() => setMoreOpen((open) => !open)}
        >
          More
        </button>
        {portfolioId ? (
          <button
            type="button"
            className={`${primaryButtonClass} flex-1 justify-center px-2 sm:hidden`}
            onClick={() => setPublishing(true)}
          >
            Publish
          </button>
        ) : (
          <Link
            href="/signup"
            className={`${primaryButtonClass} flex-1 justify-center px-2 sm:hidden`}
          >
            Sign up
          </Link>
        )}
      </nav>
    </div>
  );
}

const menuItemClass =
  "w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800";
