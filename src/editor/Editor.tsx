"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeDoc } from "@/render-kit/registry";
import { createSampleDoc, type SampleKind } from "@/render-kit/samples";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { DesignPanel, SectionsPanel, SettingsPanel } from "./panels";
import type { FromPreview, ToPreview } from "./PreviewFrame";
import { SectionEditor } from "./SectionEditor";
import { useEditor, type Device } from "./store";
import { IconButton, Segmented, inputClass } from "./ui";

const DRAFT_KEY = "portfolio-maker:draft";
const SAVE_DELAY_MS = 600;
const WIDTHS: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };

function loadDraft(): PortfolioDoc {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (raw) return normalizeDoc(JSON.parse(raw));
  } catch {
    // A missing or unreadable draft starts from the sample below.
  }
  return createSampleDoc();
}

type LeftTab = "sections" | "design" | "settings";

/** The editor: sections and design on the left, live preview in the middle, section form on the right. */
export function Editor() {
  const doc = useEditor((s) => s.doc);
  const selectedId = useEditor((s) => s.selectedId);
  const lang = useEditor((s) => s.lang);
  const device = useEditor((s) => s.device);
  const revision = useEditor((s) => s.revision);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const { load, undo, redo, select, setLang, setDevice } = useEditor.getState();

  const [tab, setTab] = useState<LeftTab>("sections");
  const [savedRevision, setSavedRevision] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);

  useEffect(() => {
    load(loadDraft());
  }, [load]);

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

  // Save the draft in this browser shortly after the last change.
  useEffect(() => {
    if (revision === 0) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(useEditor.getState().doc));
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
      setSavedRevision(revision);
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [revision]);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  if (!doc) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-500">
        Opening your draft…
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
  const selected = doc.sections.find((s) => s.id === selectedId);
  const saving = revision !== savedRevision;

  return (
    <div className="flex h-dvh flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="rounded px-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Portfolio Maker
        </Link>
        <span className="flex">
          <IconButton icon="undo" label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
          <IconButton icon="redo" label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo} />
        </span>
        <span className="text-xs text-zinc-500" role="status">
          {saving
            ? "Saving…"
            : saveFailed
              ? "Could not save in this browser"
              : "Saved in this browser"}
        </span>
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
            {tab === "settings" && <SettingsPanel doc={doc} />}
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

        {selected && (
          <aside className="w-[340px] shrink-0 border-s border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <SectionEditor key={selected.id} section={selected} />
          </aside>
        )}
      </div>
    </div>
  );
}
