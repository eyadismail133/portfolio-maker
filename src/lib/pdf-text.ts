/**
 * Reads the text of a PDF in the browser (pdf.js). Nothing is uploaded: only the text goes to
 * the server afterwards. Lines are rebuilt from the position of each piece of text.
 */
export async function pdfText(file: File, maxPages = 6): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(pdf.numPages, maxPages); n += 1) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + (item.hasEOL ? "\n" : "");
      lastY = y;
    }
    lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }
  await pdf.cleanup();
  return pages
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
