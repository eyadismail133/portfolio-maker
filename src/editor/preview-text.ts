import { readUiLang, translateUi } from "@/lib/i18n/ui";

/**
 * Interface text for the editing toolbars inside the preview frame. The frame shows a portfolio,
 * so the app's translator leaves it alone; the toolbars belong to the app and follow its
 * language (the same cookie and dictionary as everywhere else).
 */
export function tl(text: string): string {
  return readUiLang() === "ar" ? (translateUi(text) ?? text) : text;
}
