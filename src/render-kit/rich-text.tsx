import type { ReactNode } from "react";
import { safeHref } from "./i18n";

/**
 * Long texts may carry a few simple marks, written as plain characters so they stay readable
 * and safe in the saved document:
 *
 *   **bold**   *italic*   [link text](https://example.com)   lines starting with "- " form a list
 *
 * Nothing is ever turned into HTML: marks become React elements, everything else stays text.
 */

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\s\n][^*\n]*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

/** One line of text with bold, italic and links. */
export function RichInline({ text }: { text: string }): ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, l) => (
    <span key={l}>
      {l > 0 && <br />}
      {line.split(INLINE).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const href = safeHref(link[2]);
          const external = /^https?:/i.test(href);
          return (
            <a
              key={i}
              className="pk-inline-link"
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
            >
              {link[1]}
            </a>
          );
        }
        return part;
      })}
    </span>
  ));
}

/** Splits a long text into paragraphs and lists. */
export function richBlocks(
  text: string,
): ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] {
  const blocks: ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const item = line.match(/^\s*[-•]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (item) {
      if (last?.kind === "ul") last.items.push(item[1]);
      else blocks.push({ kind: "ul", items: [item[1]] });
    } else blocks.push({ kind: "p", text: line });
  }
  return blocks;
}

/** A long text as paragraphs and lists, with inline marks. */
export function RichBlocks({ text }: { text: string }): ReactNode {
  return richBlocks(text).map((block, i) =>
    block.kind === "p" ? (
      <p key={i}>
        <RichInline text={block.text} />
      </p>
    ) : (
      <ul key={i} className="pk-rich-list">
        {block.items.map((item, j) => (
          <li key={j}>
            <RichInline text={item} />
          </li>
        ))}
      </ul>
    ),
  );
}

/** The text without any marks, for places that need plain text (titles, previews, checks). */
export function plainText(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\s\n][^*\n]*)\*/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "");
}
