import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";

/** Builds the HTML zip in the browser and hands it to the person as a download. */
export async function downloadHtml(
  doc: PortfolioDoc,
  fileName: string,
): Promise<{ missingImages: number }> {
  const [{ buildExportZip }, { PAGE_CSS }, { PAGE_SCRIPT }] = await Promise.all([
    import("@/render-kit/export"),
    import("@/render-kit/generated/page-css"),
    import("@/render-kit/page-script"),
  ]);
  const result = await buildExportZip(doc, {
    css: PAGE_CSS,
    script: PAGE_SCRIPT,
    fetchImage: async (url) => {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) return null;
      return {
        bytes: new Uint8Array(await response.arrayBuffer()),
        type: response.headers.get("content-type") ?? "",
      };
    },
  });
  const blob = new Blob([result.zip.slice().buffer], { type: "application/zip" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName || "portfolio"}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  return { missingImages: result.missingImages.length };
}

/**
 * Shows the page in a new tab as a visitor gets it: the real stylesheet and page script, no
 * editing outlines. `target` is a tab opened right on the click, so pop-up blockers allow it.
 */
export async function openPreviewTab(doc: PortfolioDoc, lang: Lang, target: Window | null) {
  const [{ renderToHtml }, { PAGE_CSS }, { PAGE_SCRIPT }] = await Promise.all([
    import("@/render-kit/export"),
    import("@/render-kit/generated/page-css"),
    import("@/render-kit/page-script"),
  ]);
  const html = renderToHtml(doc, { lang, css: PAGE_CSS, script: PAGE_SCRIPT });
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  if (target) {
    target.opener = null;
    target.location.href = url;
  } else {
    window.open(url, "_blank", "noopener");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
