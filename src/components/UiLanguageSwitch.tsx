"use client";

import { useSyncExternalStore } from "react";
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
      className={`rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${className}`}
      onClick={() => setUiLang(next)}
      aria-label={next === "ar" ? "عرض الواجهة بالعربية" : "Show the interface in English"}
    >
      {next === "ar" ? "العربية" : "English"}
    </button>
  );
}
