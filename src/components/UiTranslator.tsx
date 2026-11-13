"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isPortfolioPath, readUiLang, translateUi } from "@/lib/i18n/ui";

const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP = "script,style,textarea,code,pre,.pk-root,[dir=auto],[data-no-translate]";
const NEVER = "script,style,code,pre,.pk-root,[data-no-translate]";

function skipped(node: Node): boolean {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return !element || Boolean(element.closest(SKIP));
}

function translateText(node: Text) {
  if (skipped(node)) return;
  const next = translateUi(node.data);
  if (next !== null && next !== node.data) node.data = next;
}

function translateAttributes(element: Element) {
  if (element.closest(".pk-root,[data-no-translate]")) return;
  for (const name of ATTRIBUTES) {
    const value = element.getAttribute(name);
    if (!value) continue;
    const next = translateUi(value);
    if (next !== null && next !== value) element.setAttribute(name, next.trim());
  }
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE || (root as Element).closest(NEVER)) return;
  translateAttributes(root as Element);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    // Fields where people type (dir="auto") keep their text, but their placeholder and label
    // are interface text, so only whole areas that are never translated are left out here.
    acceptNode: (node) =>
      node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(NEVER)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else translateAttributes(node as Element);
  }
}

/**
 * Shows the app in Arabic when the interface language is Arabic: swaps English interface text
 * for the dictionary's Arabic as React renders it. Portfolio pages are left alone.
 */
export function UiTranslator() {
  const pathname = usePathname();

  useEffect(() => {
    if (readUiLang() !== "ar" || isPortfolioPath(pathname)) return;
    const html = document.documentElement;
    html.lang = "ar";
    html.dir = "rtl";
    html.classList.add("pm-ui-ar");
    const translateTitle = () => {
      const next = translateUi(document.title);
      if (next) document.title = next.trim();
    };
    // Wait until React has hydrated the server HTML: changing text before that would not match
    // what React expects. Text React adds later is caught by the observer below.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      translateTree(document.body);
      translateTitle();
    };
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 200));
    const begin = () => idle(start, { timeout: 1000 });
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });
    const observer = new MutationObserver((records) => {
      if (!started) return;
      for (const record of records) {
        if (record.type === "characterData") translateText(record.target as Text);
        else if (record.type === "attributes") translateAttributes(record.target as Element);
        else record.addedNodes.forEach(translateTree);
      }
      translateTitle();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("load", begin);
    };
  }, [pathname]);

  return null;
}
