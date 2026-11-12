import type { PortfolioDoc } from "@/render-kit/schema/document";

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
