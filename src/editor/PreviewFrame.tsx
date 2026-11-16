"use client";

import {
  useEffect,
  useEffectEvent,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Renderer } from "@/render-kit/Renderer";
import { ELEMENT_KEY, type ElementStyle, type PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";
import { rootFontSize } from "@/render-kit/themes/css-vars";
import {
  assetPath,
  elementKeyFor,
  elementPath,
  findTextPath,
  getAt,
  isItemKey,
  itemPath,
} from "./doc-ops";
import { startDrag, type DragSource } from "./preview-drag";
import { tl } from "./preview-text";
import { ElementTools, GripIcon } from "./ElementTools";
import "./preview.css";

export type SectionAction = "up" | "down" | "duplicate" | "delete";

/** Messages between the editor and its preview frame. Both sides only accept their own origin. */
export type ToPreview =
  | {
      type: "pk:state";
      doc: PortfolioDoc;
      lang: Lang;
      selectedId: string | null;
      /** Element picked inside the selected section. */
      selectedEl: string | null;
      /** Which toolbar buttons work for the selected section. */
      tools: { up: boolean; down: boolean; duplicate: boolean };
    }
  | { type: "pk:scroll"; id: string; block?: "start" | "nearest" };
export type FromPreview =
  | { type: "pk:ready" }
  | { type: "pk:select"; id: string; el?: string | null }
  | { type: "pk:style"; id: string; key: string; style: Partial<ElementStyle> | null }
  /** Asks the editor to replace the photo at this element key. */
  | { type: "pk:photo"; id: string; key: string }
  | { type: "pk:action"; id: string; action: SectionAction }
  /** A section dragged onto another section. */
  | { type: "pk:move"; id: string; target: string }
  /** A list item dragged onto another item of its list, or moved one place. */
  | { type: "pk:move-item"; id: string; key: string; target?: string; delta?: -1 | 1 }
  | { type: "pk:key"; key: string; ctrl: boolean; shift: boolean; alt?: boolean }
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

/**
 * The element key for a click inside a section: a photo is found by its address in the content,
 * anything else by the nearest element the Renderer marked. Null picks the whole section.
 */
function pickedElement(
  target: HTMLElement,
  section: HTMLElement,
  content: unknown,
  point: { x: number; y: number },
): string | null {
  // Embedded frames (a map, a video) take no clicks in the editor, so they are found by place.
  for (const frame of section.querySelectorAll<HTMLElement>("iframe[data-pk-el]")) {
    const box = frame.getBoundingClientRect();
    if (
      point.x >= box.left &&
      point.x <= box.right &&
      point.y >= box.top &&
      point.y <= box.bottom
    ) {
      return frame.getAttribute("data-pk-el");
    }
  }
  if (target instanceof HTMLImageElement) {
    const path = assetPath(content, target.getAttribute("src") ?? "");
    const key = path && path.length > 0 ? elementKeyFor(content, path) : null;
    if (key && ELEMENT_KEY.test(key)) return key;
  }
  const marked = target.closest<HTMLElement>("[data-pk-el]");
  return marked && section.contains(marked) ? marked.getAttribute("data-pk-el") : null;
}

/** The element on the page for a key. Photos carry no mark, so they are found by address. */
function findElement(section: HTMLElement, key: string, content: unknown): HTMLElement | null {
  const marked = section.querySelector<HTMLElement>(`[data-pk-el="${CSS.escape(key)}"]`);
  if (marked) return marked;
  const asset = getAt(content, elementPath(content, key)) as { url?: unknown } | undefined;
  if (!asset || typeof asset.url !== "string") return null;
  for (const img of section.querySelectorAll("img")) {
    if (img.getAttribute("src") === asset.url) return img;
  }
  return null;
}

/**
 * True when the element sits beside exactly one other element (a photo next to its text), so
 * "Swap sides" can mirror the two. Checked at the width the preview has now.
 */
function besideNeighbor(el: HTMLElement | null): boolean {
  const parent = el?.parentElement;
  if (!parent || parent.children.length !== 2) return false;
  const css = getComputedStyle(parent);
  if (css.display.includes("grid")) {
    return css.gridTemplateColumns.trim().split(/\s+/).length >= 2;
  }
  return css.display.includes("flex") && css.flexDirection.startsWith("row");
}

/** True when the block lays its children out one under the other as a grid or a column. */
function stacksVertically(block: HTMLElement): boolean {
  const css = getComputedStyle(block);
  if (css.display.includes("grid")) {
    return css.gridTemplateColumns.trim().split(/\s+/).length === 1;
  }
  return css.display.includes("flex") && css.flexDirection.startsWith("column");
}

/**
 * The element "Move to the top / bottom" acts on: the picked one, or the marked group it is in
 * (a button moves with its group of buttons), when that sits in a block that can reorder.
 * List items are left out: they move with the item tools.
 */
function orderTarget(el: HTMLElement | null): string | null {
  const group = el?.parentElement?.closest<HTMLElement>("[data-pk-el]");
  for (const candidate of [el, group]) {
    const key = candidate?.getAttribute("data-pk-el");
    const block = candidate?.parentElement;
    if (!key || isItemKey(key) || !block || block.children.length < 2) continue;
    if (stacksVertically(block)) return key;
  }
  return null;
}

function sameRect(a: DOMRect | null, b: DOMRect | null) {
  return (
    !!a &&
    !!b &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

/** The portfolio as shown inside the editor. It renders whatever document the editor sends. */
export function PreviewFrame() {
  const [state, setState] = useState<Extract<ToPreview, { type: "pk:state" }> | null>(null);
  const [toolbarTop, setToolbarTop] = useState<number | null>(null);
  // Drawn over the page instead of on the section: a shaped section is cut by a mask, which
  // would cut its own outline too.
  const [outline, setOutline] = useState<DOMRect | null>(null);
  const [elOutline, setElOutline] = useState<DOMRect | null>(null);
  const [drop, setDrop] = useState<DOMRect | null>(null);
  const [dragging, setDragging] = useState(false);

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
      // Alt with an arrow moves the picked item or section.
      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        send({ type: "pk:key", key: event.key, ctrl, shift: event.shiftKey, alt: true });
        return;
      }
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
  const selectedEl = state?.selectedEl ?? null;
  const selectedSection = state?.doc.sections.find((s) => s.id === selectedId);
  const content = selectedSection?.content;
  const fontSize = state ? rootFontSize(state.doc.theme) : null;

  // The page text size lives on <html>, as on the published page.
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize ?? "";
  }, [fontSize]);

  /** Keeps the toolbar at the top of the selected section, or at the top of the screen when it scrolls past. */
  // An effect event: it always reads the current selection, and only effects call it.
  const place = useEffectEvent(() => {
    const el = selectedId ? document.getElementById(selectedId) : null;
    const next = el ? el.getBoundingClientRect() : null;
    // Only a real change re-renders: this runs after every render.
    setOutline((old) => (sameRect(old, next) ? old : next));
    const picked = el && selectedEl ? findElement(el, selectedEl, content) : null;
    const pickedRect = picked ? picked.getBoundingClientRect() : null;
    setElOutline((old) => (sameRect(old, pickedRect) ? old : pickedRect));
    if (!el) return setToolbarTop(null);
    const box = el.getBoundingClientRect();
    if (box.bottom < 48 || box.top > window.innerHeight) return setToolbarTop(null);
    setToolbarTop(Math.max(8, box.top + 8));
  });

  useEffect(() => {
    for (const el of document.querySelectorAll("[data-pk-selected]"))
      el.removeAttribute("data-pk-selected");
    if (selectedId) document.getElementById(selectedId)?.setAttribute("data-pk-selected", "");
    // After the page has laid out the new content.
    const frame = requestAnimationFrame(() => place());
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    const onChange = () => place();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    // Images that finish loading move the sections below them.
    const observer = new ResizeObserver(onChange);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  if (!state) return null;

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(".pk-editor-toolbar")) return;
    // Links and buttons do not leave the page while editing.
    if (target.closest("a, button")) event.preventDefault();
    const section = target.closest<HTMLElement>(".pk-section");
    if (!section?.id) return;
    const sectionContent = state.doc.sections.find((s) => s.id === section.id)?.content;
    send({
      type: "pk:select",
      id: section.id,
      el: pickedElement(target, section, sectionContent, { x: event.clientX, y: event.clientY }),
    });
  };

  const tools: SectionAction[] = ["up", "down", "duplicate", "delete"];
  // Read while drawing so the element toolbar knows the section colors and whether it is a photo.
  const sectionEl = selectedId ? document.getElementById(selectedId) : null;
  const pickedEl = sectionEl && selectedEl ? findElement(sectionEl, selectedEl, content) : null;
  const orderKey = orderTarget(pickedEl);

  // A picked list item can move within its list.
  const itemPlace = isItemKey(selectedEl) ? itemPath(content, selectedEl) : null;
  const listLength = itemPlace
    ? ((getAt(content, itemPlace.slice(0, -1)) as unknown[] | undefined)?.length ?? 0)
    : 0;
  const itemIndex = itemPlace ? (itemPlace[itemPlace.length - 1] as number) : -1;

  const beginDrag = (event: ReactPointerEvent, source: DragSource) => {
    if (event.button !== 0) return;
    event.preventDefault();
    setDragging(true);
    startDrag(event, source, content, {
      over: (found) =>
        setDrop(
          found && found.target !== (source.kind === "item" ? source.key : source.id)
            ? found.rect
            : null,
        ),
      end: () => setDragging(false),
      drop: (target) => {
        if (source.kind === "section") send({ type: "pk:move", id: source.id, target });
        else send({ type: "pk:move-item", id: source.id, key: source.key, target });
      },
    });
  };
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
      data-pk-dragging={dragging ? "" : undefined}
      onClickCapture={onClick}
      onDoubleClick={onDoubleClick}
      onSubmitCapture={(event) => event.preventDefault()}
    >
      <Renderer doc={state.doc} lang={state.lang} editing />
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
      {selectedId && selectedEl && elOutline && (
        <div
          className="pk-editor-eloutline"
          aria-hidden="true"
          style={{
            top: elOutline.top - 3,
            left: elOutline.left - 3,
            width: elOutline.width + 6,
            height: elOutline.height + 6,
          }}
        />
      )}
      {selectedId && selectedEl && elOutline && sectionEl && (
        <ElementTools
          rect={elOutline}
          section={sectionEl}
          style={selectedSection?.elements?.[selectedEl]}
          photo={
            pickedEl?.tagName === "IMG"
              ? "photo"
              : pickedEl?.classList.contains("pk-media--empty")
                ? "empty"
                : false
          }
          onStyle={(style) => send({ type: "pk:style", id: selectedId, key: selectedEl, style })}
          onPhoto={() => send({ type: "pk:photo", id: selectedId, key: selectedEl })}
          order={
            orderKey
              ? {
                  value: selectedSection?.elements?.[orderKey]?.order,
                  onOrder: (order) =>
                    send({ type: "pk:style", id: selectedId, key: orderKey, style: { order } }),
                }
              : undefined
          }
          canFlip={besideNeighbor(pickedEl) || !!selectedSection?.elements?.[selectedEl]?.flip}
          move={
            itemPlace
              ? {
                  earlier: itemIndex > 0,
                  later: itemIndex < listLength - 1,
                  onMove: (delta) =>
                    send({ type: "pk:move-item", id: selectedId, key: selectedEl, delta }),
                  onGrip: (event) =>
                    beginDrag(event, { kind: "item", id: selectedId, key: selectedEl }),
                }
              : undefined
          }
        />
      )}
      {drop && (
        <div
          className="pk-editor-drop"
          aria-hidden="true"
          style={{ top: drop.top, left: drop.left, width: drop.width, height: drop.height }}
        />
      )}
      {selectedId && toolbarTop !== null && (
        <div
          className="pk-editor-toolbar"
          role="toolbar"
          aria-label={tl("Section")}
          style={{ top: toolbarTop }}
        >
          <button
            type="button"
            className="pk-editor-grip"
            title={tl("Drag to move")}
            aria-label={tl("Drag to move")}
            disabled={!state.tools.up && !state.tools.down}
            onPointerDown={(event) => beginDrag(event, { kind: "section", id: selectedId })}
          >
            <GripIcon />
          </button>
          {tools.map((action) => (
            <button
              key={action}
              type="button"
              title={tl(TOOL_LABELS[action])}
              aria-label={tl(TOOL_LABELS[action])}
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
