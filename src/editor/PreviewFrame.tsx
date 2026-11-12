"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Renderer } from "@/render-kit/Renderer";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";
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
  | { type: "pk:key"; key: string; ctrl: boolean; shift: boolean };

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
      const editing = (event.target as HTMLElement).closest("input, textarea, select");
      if (editing) return;
      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl || event.key === "Delete" || event.key === "Backspace") {
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

  /** Keeps the toolbar at the top of the selected section, or at the top of the screen when it scrolls past. */
  const place = useCallback(() => {
    const el = selectedId ? document.getElementById(selectedId) : null;
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
    return () => {
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

  return (
    <div onClickCapture={onClick} onSubmitCapture={(event) => event.preventDefault()}>
      <Renderer doc={state.doc} lang={state.lang} />
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
