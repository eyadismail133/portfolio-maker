"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { tl } from "./preview-text";
import {
  ELEMENT_ALIGNS,
  ELEMENT_COLORS,
  ELEMENT_ORDERS,
  ELEMENT_SIZES,
  type ElementStyle,
} from "@/render-kit/schema/document";

/**
 * The small toolbar on the element picked inside the preview: colors, size, weight, alignment,
 * hide and reset for text and cards, moves for list items, and replace, size, hide and reset for
 * photos. It lives in the
 * preview frame and is not part of the portfolio, so its own colors are fixed on purpose.
 */

const COLOR_NAMES: Record<(typeof ELEMENT_COLORS)[number], string> = {
  text: "Text color",
  muted: "Soft text color",
  primary: "Main color",
  accent: "Accent color",
};
const COLOR_VARS: Record<(typeof ELEMENT_COLORS)[number], string> = {
  text: "--pk-text",
  muted: "--pk-muted",
  primary: "--pk-primary",
  accent: "--pk-accent",
};
const SIZE_LABELS: Record<(typeof ELEMENT_SIZES)[number], [string, string]> = {
  small: ["S", "Smaller"],
  large: ["L", "Larger"],
  huge: ["XL", "Much larger"],
};
const ALIGN_LABELS: Record<(typeof ELEMENT_ALIGNS)[number], string> = {
  start: "Align to the start",
  center: "Center",
  end: "Align to the end",
};
const ORDER_LABELS: Record<(typeof ELEMENT_ORDERS)[number], string> = {
  first: "Move to the top",
  last: "Move to the bottom",
};
const ORDER_PATHS: Record<(typeof ELEMENT_ORDERS)[number], string> = {
  first: "M5 4h14M12 20V9M7 13l5-5 5 5",
  last: "M5 20h14M12 4v11M7 11l5 5 5-5",
};
const ALIGN_PATHS: Record<(typeof ELEMENT_ALIGNS)[number], string> = {
  start: "M4 6h16M4 12h10M4 18h13",
  center: "M4 6h16M7 12h10M5 18h14",
  end: "M4 6h16M10 12h10M7 18h13",
};

function Icon({ d }: { d: string }) {
  return (
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
      <path d={d} />
    </svg>
  );
}

export function ElementTools({
  rect,
  section,
  style,
  photo,
  onStyle,
  onPhoto,
  move,
  canFlip = false,
  order,
}: {
  /** Where the element is on screen. */
  rect: DOMRect;
  /** The section the element is in, to read its colors. */
  section: HTMLElement;
  style: ElementStyle | undefined;
  /**
   * The element is a photo (or the placeholder of a missing one): offer replacing it, its size,
   * hide and reset instead of text styles.
   */
  photo: false | "photo" | "empty";
  /** `null` resets the element. */
  onStyle: (style: Partial<ElementStyle> | null) => void;
  onPhoto: () => void;
  /** The element (or its group) can move to the top or the bottom of its block. */
  order?: {
    value: (typeof ELEMENT_ORDERS)[number] | undefined;
    onOrder: (order: (typeof ELEMENT_ORDERS)[number] | undefined) => void;
  };
  /** The element sits beside one other element, so it can swap sides with it. */
  canFlip?: boolean;
  /** Set for a list item: it can be dragged or moved one place within its list. */
  move?: {
    earlier: boolean;
    later: boolean;
    onMove: (delta: -1 | 1) => void;
    onGrip: (event: ReactPointerEvent) => void;
  };
}) {
  const colors = getComputedStyle(section);
  // On a right-to-left page "earlier" is to the right.
  const rtl = colors.direction === "rtl";
  const back = "M15 18l-6-6 6-6";
  const forward = "M9 18l6-6-6-6";
  const toggle = <K extends keyof ElementStyle>(key: K, value: ElementStyle[K]) =>
    onStyle({ [key]: style?.[key] === value ? undefined : value } as Partial<ElementStyle>);
  // The toolbar sits just above the element: its bottom edge is placed, so however many rows it
  // wraps to in a narrow preview it never covers the element. Near the top it goes below.
  const below = rect.top < 140;
  const width = Math.min(photo ? 400 : move ? 680 : 570, window.innerWidth - 16);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 8 - width));
  const place: CSSProperties = below
    ? { top: rect.bottom + 8, left }
    : { top: rect.top - 8, left, transform: "translateY(-100%)" };

  return (
    <div
      className="pk-editor-toolbar pk-editor-eltools"
      role="toolbar"
      aria-label={tl(photo ? "Photo" : "Element")}
      style={{ ...place, insetInlineEnd: "auto" }}
    >
      {move && (
        <>
          <button
            type="button"
            className="pk-editor-grip"
            title={tl("Drag to move")}
            aria-label={tl("Drag to move")}
            onPointerDown={move.onGrip}
          >
            <GripIcon />
          </button>
          <button
            type="button"
            title={tl("Move earlier")}
            aria-label={tl("Move earlier")}
            disabled={!move.earlier}
            onClick={() => move.onMove(-1)}
          >
            <Icon d={rtl ? forward : back} />
          </button>
          <button
            type="button"
            title={tl("Move later")}
            aria-label={tl("Move later")}
            disabled={!move.later}
            onClick={() => move.onMove(1)}
          >
            <Icon d={rtl ? back : forward} />
          </button>
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
        </>
      )}
      {photo ? (
        <>
          <button type="button" className="pk-editor-eltools__wide" onClick={onPhoto}>
            {tl(photo === "empty" ? "Add photo" : "Replace photo")}
          </button>
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
          <SizeTools style={style} toggle={toggle} />
        </>
      ) : (
        <>
          {ELEMENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={tl(COLOR_NAMES[color])}
              aria-label={tl(COLOR_NAMES[color])}
              aria-pressed={style?.color === color}
              onClick={() => toggle("color", color)}
            >
              <span
                className="pk-editor-swatch"
                style={{ "--swatch": colors.getPropertyValue(COLOR_VARS[color]) } as CSSProperties}
              />
            </button>
          ))}
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
          <SizeTools style={style} toggle={toggle} />
          <button
            type="button"
            title={tl("Bold text")}
            aria-label={tl("Bold text")}
            aria-pressed={style?.weight === "bold"}
            onClick={() => toggle("weight", "bold")}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            title={tl("Regular weight")}
            aria-label={tl("Regular weight")}
            aria-pressed={style?.weight === "normal"}
            onClick={() => toggle("weight", "normal")}
          >
            B
          </button>
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
          {ELEMENT_ALIGNS.map((align) => (
            <button
              key={align}
              type="button"
              title={tl(ALIGN_LABELS[align])}
              aria-label={tl(ALIGN_LABELS[align])}
              aria-pressed={style?.align === align}
              onClick={() => toggle("align", align)}
            >
              <Icon d={ALIGN_PATHS[align]} />
            </button>
          ))}
        </>
      )}
      {order && (
        <>
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
          {ELEMENT_ORDERS.map((place) => (
            <button
              key={place}
              type="button"
              title={tl(ORDER_LABELS[place])}
              aria-label={tl(ORDER_LABELS[place])}
              aria-pressed={order.value === place}
              onClick={() => order.onOrder(order.value === place ? undefined : place)}
            >
              <Icon d={ORDER_PATHS[place]} />
            </button>
          ))}
        </>
      )}
      {canFlip && (
        <>
          <span className="pk-editor-eltools__gap" aria-hidden="true" />
          <button
            type="button"
            title={tl("Swap sides")}
            aria-label={tl("Swap sides")}
            aria-pressed={!!style?.flip}
            onClick={() => toggle("flip", true)}
          >
            <Icon d="M7 7h11l-3-3M17 17H6l3 3" />
          </button>
        </>
      )}
      <StateTools style={style} onStyle={onStyle} toggle={toggle} />
    </div>
  );
}

type Toggle = <K extends keyof ElementStyle>(key: K, value: ElementStyle[K]) => void;

function SizeTools({ style, toggle }: { style: ElementStyle | undefined; toggle: Toggle }) {
  return (
    <>
      {ELEMENT_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          title={tl(SIZE_LABELS[size][1])}
          aria-label={tl(SIZE_LABELS[size][1])}
          aria-pressed={style?.size === size}
          onClick={() => toggle("size", size)}
        >
          {SIZE_LABELS[size][0]}
        </button>
      ))}
    </>
  );
}

function StateTools({
  style,
  onStyle,
  toggle,
}: {
  style: ElementStyle | undefined;
  onStyle: (style: Partial<ElementStyle> | null) => void;
  toggle: <K extends keyof ElementStyle>(key: K, value: ElementStyle[K]) => void;
}) {
  return (
    <>
      <span className="pk-editor-eltools__gap" aria-hidden="true" />
      <button
        type="button"
        title={tl(style?.hidden ? "Show on the page" : "Hide on the page")}
        aria-label={tl(style?.hidden ? "Show on the page" : "Hide on the page")}
        aria-pressed={!!style?.hidden}
        onClick={() => toggle("hidden", true)}
      >
        <Icon
          d={
            style?.hidden
              ? "M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.3M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6c1.6 0 3-.4 4.3-1.1"
              : "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          }
        />
      </button>
      <button
        type="button"
        title={tl("Back to the design's look")}
        aria-label={tl("Back to the design's look")}
        disabled={!style}
        onClick={() => onStyle(null)}
      >
        <Icon d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
      </button>
    </>
  );
}

export function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}
