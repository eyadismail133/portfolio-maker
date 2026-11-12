/** Text changes for the formatting buttons above long text fields. Pure, so they are easy to test. */

export type Selection = { text: string; start: number; end: number };
export type Edit = { text: string; start: number; end: number };

/** Wraps the selection in marks, or adds a placeholder word when nothing is selected. */
export function wrap(sel: Selection, before: string, after: string, placeholder: string): Edit {
  const chosen = sel.text.slice(sel.start, sel.end) || placeholder;
  const text = sel.text.slice(0, sel.start) + before + chosen + after + sel.text.slice(sel.end);
  const start = sel.start + before.length;
  return { text, start, end: start + chosen.length };
}

/** Turns the selection into a link and selects the address so it can be typed over. */
export function link(sel: Selection, placeholder: string): Edit {
  const chosen = sel.text.slice(sel.start, sel.end) || placeholder;
  const address = "https://";
  const inserted = `[${chosen}](${address})`;
  const text = sel.text.slice(0, sel.start) + inserted + sel.text.slice(sel.end);
  const start = sel.start + chosen.length + 3;
  return { text, start, end: start + address.length };
}

/** Starts or ends a list on every line the selection touches. */
export function toggleList(sel: Selection): Edit {
  const lineStart = sel.text.lastIndexOf("\n", sel.start - 1) + 1;
  const nextBreak = sel.text.indexOf("\n", sel.end);
  const lineEnd = nextBreak === -1 ? sel.text.length : nextBreak;
  const lines = sel.text.slice(lineStart, lineEnd).split("\n");
  const isList = lines.every((line) => /^\s*-\s/.test(line) || !line.trim());
  const changed = lines
    .map((line) => (isList ? line.replace(/^\s*-\s/, "") : line.trim() ? `- ${line}` : line))
    .join("\n");
  const text = sel.text.slice(0, lineStart) + changed + sel.text.slice(lineEnd);
  return { text, start: lineStart, end: lineStart + changed.length };
}
