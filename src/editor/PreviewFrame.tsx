"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Renderer } from "@/render-kit/Renderer";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";
import "@/render-kit/styles/index.css";
import "./preview.css";

/** Messages between the editor and its preview frame. Both sides only accept their own origin. */
export type ToPreview =
  | { type: "pk:state"; doc: PortfolioDoc; lang: Lang; selectedId: string | null }
  | { type: "pk:scroll"; id: string };
export type FromPreview = { type: "pk:ready" } | { type: "pk:select"; id: string };

/** The portfolio as shown inside the editor. It renders whatever document the editor sends. */
export function PreviewFrame() {
  const [state, setState] = useState<Extract<ToPreview, { type: "pk:state" }> | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<ToPreview>) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data;
      if (message?.type === "pk:state") setState(message);
      if (message?.type === "pk:scroll") {
        document.getElementById(message.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "pk:ready" } satisfies FromPreview, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const selectedId = state?.selectedId ?? null;
  useEffect(() => {
    for (const el of document.querySelectorAll("[data-pk-selected]"))
      el.removeAttribute("data-pk-selected");
    if (selectedId) document.getElementById(selectedId)?.setAttribute("data-pk-selected", "");
  });

  if (!state) return null;

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    // Links and buttons do not leave the page while editing.
    if (target.closest("a, button")) event.preventDefault();
    const section = target.closest(".pk-section");
    if (section?.id) {
      window.parent.postMessage(
        { type: "pk:select", id: section.id } satisfies FromPreview,
        window.location.origin,
      );
    }
  };

  return (
    <div onClickCapture={onClick} onSubmitCapture={(event) => event.preventDefault()}>
      <Renderer doc={state.doc} lang={state.lang} />
    </div>
  );
}
