"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Renderer } from "@/render-kit/Renderer";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";
import { rootFontSize } from "@/render-kit/themes/css-vars";
import { findTextPath } from "./doc-ops";
import "./preview.css";

export type SectionAction = "up" | "down" | "duplicate" | "delete";

/** Messages between the editor and its preview frame. Both sides only accept their own origin. */
export type ToPreview =
  | {
      type: "pk:state";
      doc: PortfolioDoc;
      lang: Lang;
      selectedId: string | null;
      /** Which toolbar buttons work for the selected section. */
      tools: { up: boolean; down: boolean; duplicate: boolean };
    }
  | { type: "pk:scroll"; id: string; block?: "start" | "nearest" };
export type FromPreview =
  | { type: "pk:ready" }
  | { type: "pk:select"; id: string }
  | { type: "pk:action"; id: string; action: SectionAction }
  | { type: "pk:key"; key: string; ctrl: boolean; shift: boolean }
  | { type: "pk:edit"; id: string; path: (string | number)[]; text: string }
  | { type: "pk:note"; text: string };

const TOOL_LABELS: Record<SectionAction, string> = {
  up: "Move up",
  down: "Move down",
  duplicate: "Duplicate",
  delete: "Delete",
};

const TOOL_PATHS: Record<SectionAction, string> = {
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  duplicate: "M9 9h11v11H9zM5 15H4V4h11v1",
  delete: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
};

function send(message: FromPreview) {
  window.parent.postMessage(message, window.location.origin);
}

/** The portfolio as shown inside the editor. It renders whatever document the editor sends. */
export function PreviewFrame() {
  const [state, setState] = useState<Extract<ToPreview, { type: "pk:state" }> | null>(null);
  const [toolbarTop, setToolbarTop] = useState<number | null>(null);
  // Drawn over the page instead of on the section: a shaped section is cut by a mask, which
  // would cut its own outline too.
  const [outline, setOutline] = useState<DOMRect | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<ToPreview>) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data;
      if (message?.type === "pk:state") setState(message);
      if (message?.type === "pk:scroll") {
        document
          .getElementById(message.id)
          ?.scrollIntoView({ behavior: "smooth", block: message.block ?? "start" });
      }
    };
    // Shortcuts pressed while the preview has focus still reach the editor.
    const onKey = (event: KeyboardEvent) => {
      const editing = (event.target as HTMLElement).closest(
        "input, textarea, select, [contenteditable]",
      );
      if (editing) return;
      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl || event.key === "Delete" || event.key === "Backspace" || event.key === "Escape") {
        if (ctrl && ["z", "y", "s", "d"].includes(event.key.toLowerCase())) event.preventDefault();
        send({ type: "pk:key", key: event.key, ctrl, shift: event.shiftKey });
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    send({ type: "pk:ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectedId = state?.selectedId ?? null;
  const fontSize = state ? rootFontSize(state.doc.theme) : null;

  // The page text size lives on <html>, as on the published page.
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize ?? "";
  }, [fontSize]);

  /** Keeps the toolbar at the top of the selected section, or at the top of the screen when it scrolls past. */
  const place = useCallback(() => {
    const el = selectedId ? document.getElementById(selectedId) : null;
    const next = el ? el.getBoundingClientRect() : null;
    // Only a real change re-renders: this runs after every render.
    setOutline((old) =>
      old &&
      next &&
      ["top", "left", "width", "height"].every((k) => old[k as "top"] === next[k as "top"])
        ? old
        : next,
    );
    if (!el) return setToolbarTop(null);
    const box = el.getBoundingClientRect();
    if (box.bottom < 48 || box.top > window.innerHeight) return setToolbarTop(null);
    setToolbarTop(Math.max(8, box.top + 8));
  }, [selectedId]);

  useEffect(() => {
    for (const el of document.querySelectorAll("[data-pk-selected]"))
      el.removeAttribute("data-pk-selected");
    if (selectedId) document.getElementById(selectedId)?.setAttribute("data-pk-selected", "");
    // After the page has laid out the new content.
    const frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    // Images that finish loading move the sections below them.
    const observer = new ResizeObserver(() => place());
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [place]);

  if (!state) return null;

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(".pk-editor-toolbar")) return;
    // Links and buttons do not leave the page while editing.
    if (target.closest("a, button")) event.preventDefault();
    const section = target.closest(".pk-section");
    if (section?.id) send({ type: "pk:select", id: section.id });
  };

  const tools: SectionAction[] = ["up", "down", "duplicate", "delete"];
  const enabled = (action: SectionAction) => action === "delete" || state.tools[action];

  /** Double-click a text to type over it. Enter or clicking away keeps it; Escape cancels. */
  const onDoubleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(".pk-editor-toolbar")) return;
    const section = target.closest<HTMLElement>(".pk-section");
    const content = state.doc.sections.find((s) => s.id === section?.id)?.content;
    if (!section || content === undefined) return;
    // The smallest element holding the text that was clicked.
    const el =
      target.closest<HTMLElement>(
        "h1, h2, h3, h4, p, li, dt, dd, a, span, strong, em, blockquote, figcaption, summary, label > span",
      ) ?? target;
    const original = el.innerText;
    const path = findTextPath(content, state.lang, original);
    if (!path) {
      send({ type: "pk:note", text: "Edit this text in the form on the right." });
      return;
    }
    event.preventDefault();
    el.setAttribute("contenteditable", "plaintext-only");
    el.setAttribute("data-pk-editing", "");
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    let cancelled = false;
    const finish = () => {
      el.removeEventListener("blur", finish);
      el.removeEventListener("keydown", onKey);
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-pk-editing");
      const text = el.innerText.replace(/\n$/, "");
      if (cancelled) el.innerText = original;
      else if (text !== original) send({ type: "pk:edit", id: section.id, path, text });
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        cancelled = true;
        el.blur();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      }
    };
    el.addEventListener("blur", finish);
    el.addEventListener("keydown", onKey);
  };

  return (
    <div
      onClickCapture={onClick}
      onDoubleClick={onDoubleClick}
      onSubmitCapture={(event) => event.preventDefault()}
    >
      <Renderer doc={state.doc} lang={state.lang} />
      {selectedId && outline && (
        <div
          className="pk-editor-outline"
          aria-hidden="true"
          style={{
            top: outline.top,
            left: outline.left,
            width: outline.width,
            height: outline.height,
          }}
        />
      )}
      {selectedId && toolbarTop !== null && (
        <div
          className="pk-editor-toolbar"
          role="toolbar"
          aria-label="Section"
          style={{ top: toolbarTop }}
        >
          {tools.map((action) => (
            <button
              key={action}
              type="button"
              title={TOOL_LABELS[action]}
              aria-label={TOOL_LABELS[action]}
              disabled={!enabled(action)}
              onClick={() => send({ type: "pk:action", id: selectedId, action })}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={TOOL_PATHS[action]} />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
