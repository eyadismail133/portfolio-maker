import { isItemKey, itemPath } from "./doc-ops";

/**
 * Dragging inside the editor's preview frame: a section onto another section, or a list item
 * onto another item of the same list. It starts from a grip button in a toolbar, follows the
 * pointer (not the browser's drag and drop, which would fight with picking and text editing),
 * scrolls near the top and bottom edges, and Escape cancels.
 */

export type DragSource =
  { kind: "section"; id: string } | { kind: "item"; id: string; key: string };

export type DragCallbacks = {
  /** The place the drop would go, or null over a place it cannot go. */
  over: (target: { target: string; rect: DOMRect } | null) => void;
  drop: (target: string) => void;
  end: () => void;
};

const EDGE = 56;
const SCROLL_STEP = 14;

function listOf(content: unknown, key: string): string | null {
  return itemPath(content, key)?.slice(0, -1).join(".") ?? null;
}

/** Where a drop at this point would go. Pinned sections (navbar, footer) never move. */
export function dropTargetAt(
  x: number,
  y: number,
  source: DragSource,
  content: unknown,
): { target: string; el: HTMLElement } | null {
  const hit = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!hit || hit.closest(".pk-editor-toolbar")) return null;
  if (source.kind === "section") {
    const section = hit.closest<HTMLElement>(".pk-section");
    return section && section.tagName === "SECTION" && section.id
      ? { target: section.id, el: section }
      : null;
  }
  const sectionEl = document.getElementById(source.id);
  const list = listOf(content, source.key);
  let el = hit.closest<HTMLElement>("[data-pk-el]");
  while (el && sectionEl?.contains(el)) {
    const key = el.getAttribute("data-pk-el");
    if (isItemKey(key) && listOf(content, key) === list) return { target: key, el };
    el = el.parentElement?.closest<HTMLElement>("[data-pk-el]") ?? null;
  }
  return null;
}

export function startDrag(
  start: { clientX: number; clientY: number },
  source: DragSource,
  content: unknown,
  callbacks: DragCallbacks,
) {
  let current: string | null = null;
  let pointerY = start.clientY;
  let pointerX = start.clientX;

  const update = () => {
    const found = dropTargetAt(pointerX, pointerY, source, content);
    current = found?.target ?? null;
    callbacks.over(found ? { target: found.target, rect: found.el.getBoundingClientRect() } : null);
  };
  // Scrolls while the pointer rests near an edge, so far places can be reached.
  const scroll = window.setInterval(() => {
    if (pointerY < EDGE) window.scrollBy(0, -SCROLL_STEP);
    else if (pointerY > window.innerHeight - EDGE) window.scrollBy(0, SCROLL_STEP);
    else return;
    update();
  }, 16);

  const onMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    update();
  };
  const stop = () => {
    window.clearInterval(scroll);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", stop);
    window.removeEventListener("keydown", onKey, true);
    callbacks.over(null);
    callbacks.end();
  };
  const onUp = () => {
    const target = current;
    stop();
    if (target) callbacks.drop(target);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    stop();
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", stop);
  window.addEventListener("keydown", onKey, true);
}
