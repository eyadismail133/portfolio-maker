"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer } from "@/render-kit/Renderer";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";

/** Width the page is laid out at before it is scaled down. */
const PAGE_WIDTH = 1280;

/** A real portfolio page scaled down to fit a card. It cannot be clicked or focused. */
export function MiniPreview({
  doc,
  lang,
  className = "",
  aspect = "aspect-[16/11]",
  pageWidth = PAGE_WIDTH,
}: {
  doc: PortfolioDoc;
  lang?: Lang;
  className?: string;
  /** Tailwind aspect class of the visible window. */
  aspect?: string;
  /** Width the page is laid out at before scaling: 1280 shows the desktop layout, 400 a phone's. */
  pageWidth?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  // The page is laid out at `pageWidth`, or wider when the box is wider, so it is never
  // stretched beyond its real size.
  const [view, setView] = useState({ scale: 0, width: pageWidth });
  const scale = view.scale;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(pageWidth, entry.contentRect.width);
      setView({ scale: entry.contentRect.width / width, width });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageWidth]);

  return (
    <div
      ref={box}
      className={`relative ${aspect} overflow-hidden bg-white select-none ${className}`}
      aria-hidden="true"
      inert
    >
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 transition-opacity duration-300"
          style={{ width: view.width, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          <Renderer doc={doc} lang={lang} />
        </div>
      )}
    </div>
  );
}
