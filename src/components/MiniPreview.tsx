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
}: {
  doc: PortfolioDoc;
  lang?: Lang;
  className?: string;
  /** Tailwind aspect class of the visible window. */
  aspect?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / PAGE_WIDTH),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
          style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          <Renderer doc={doc} lang={lang} />
        </div>
      )}
    </div>
  );
}
