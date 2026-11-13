"use client";

import { useSyncExternalStore } from "react";
import { UiIcon } from "@/editor/ui";
import { readUiLang, setUiLang } from "@/lib/i18n/ui";

const noSubscribe = () => () => {};

/** Switches the app interface between English and Arabic. Its own label is never translated. */
export function UiLanguageSwitch({ className = "" }: { className?: string }) {
  const lang = useSyncExternalStore(noSubscribe, readUiLang, () => "en" as const);
  const next = lang === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      data-no-translate
      lang={next}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-2xs backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:text-zinc-950 active:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white ${className}`}
      onClick={() => setUiLang(next)}
      aria-label={next === "ar" ? "عرض الواجهة بالعربية" : "Show the interface in English"}
    >
      <UiIcon name="globe" size={14} className="text-blue-600 dark:text-blue-400" />
      <span>{next === "ar" ? "العربية" : "English"}</span>
    </button>
  );
}
