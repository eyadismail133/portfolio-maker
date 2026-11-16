import type { ReactNode } from "react";
import { safeHref, safeImageUrl } from "../i18n";
import { RichBlocks } from "../rich-text";
import type { SectionContext } from "../registry";
import type { AssetRef, Link, LocalizedText } from "../schema/primitives";

/** Sample text in both languages. */
export const L = (en: string, ar: string) => ({ en, ar });

/** Element key of a field inside a list item ("i3.photo"), or none while the item has no id. */
export const sub = (id: string | undefined, key: string) => (id ? `${id}.${key}` : undefined);

type HeadProps = {
  heading?: LocalizedText;
  subheading?: LocalizedText;
  /** Content key the subheading comes from, for element styles. */
  subheadingKey?: string;
  ctx: SectionContext;
  children: ReactNode;
};

/** Section layout with the heading in a side column on wide screens. */
export function Rail({
  heading,
  subheading,
  subheadingKey = "subheading",
  ctx,
  children,
}: HeadProps) {
  const title = ctx.t(heading);
  const sub = ctx.t(subheading);
  return (
    <div className="pk-rail">
      {(title || sub) && (
        <div className="pk-rail__head">
          {title && <h2 {...ctx.el("heading", "pk-h2")}>{title}</h2>}
          {sub && <p {...ctx.el(subheadingKey, "pk-sub")}>{sub}</p>}
        </div>
      )}
      <div className="pk-rail__body">{children}</div>
    </div>
  );
}

/** Section layout with the heading above the content. */
export function Stack({
  heading,
  subheading,
  subheadingKey = "subheading",
  ctx,
  children,
}: HeadProps) {
  const title = ctx.t(heading);
  const sub = ctx.t(subheading);
  return (
    <div className="pk-stack">
      {(title || sub) && (
        <div className="pk-stack__head">
          {title && <h2 {...ctx.el("heading", "pk-h2")}>{title}</h2>}
          {sub && <p {...ctx.el(subheadingKey, "pk-sub")}>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Text with line breaks kept as paragraphs. */
export function Paragraphs({
  text,
  className = "pk-prose",
  ctx,
  elKey,
}: {
  text: string;
  className?: string;
  /** With `elKey`, the text can be picked and styled in the editor. */
  ctx?: SectionContext;
  elKey?: string;
}) {
  if (!text.trim()) return null;
  return (
    <div {...(ctx ? ctx.el(elKey, className) : { className })}>
      <RichBlocks text={text} />
    </div>
  );
}

function initials(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("");
}

/** An image, or a calm placeholder with initials when there is no image yet. */
export function Media({
  asset,
  label,
  className = "",
  ctx,
  elKey,
}: {
  asset?: AssetRef;
  label: string;
  className?: string;
  /** With `elKey`, the photo (or its placeholder) can be picked and styled in the editor. */
  ctx?: SectionContext;
  /** Element key of the photo: its content path, such as "image" or "i3.photo". */
  elKey?: string;
}) {
  const url = safeImageUrl(asset?.url);
  const el = (classes: string) => (ctx ? ctx.el(elKey, classes) : { className: classes });
  if (asset && url) {
    return (
      <img
        {...el(`pk-media ${className}`)}
        src={url}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div {...el(`pk-media pk-media--empty ${className}`)} aria-hidden="true">
      <span>{initials(label)}</span>
    </div>
  );
}

export function ButtonLink({
  link,
  ctx,
  kind = "primary",
  elKey,
}: {
  link?: Link;
  ctx: SectionContext;
  kind?: "primary" | "ghost";
  /** Element key of the button: its content path, such as "primaryCta". */
  elKey?: string;
}) {
  const label = ctx.t(link?.label);
  if (!link || !label) return null;
  return (
    <a {...ctx.el(elKey, `pk-btn pk-btn--${kind}`)} href={safeHref(link.href)}>
      {label}
    </a>
  );
}

/** Opens other sites in a new tab; in-page, mail and phone links stay in the same tab. */
export function linkProps(href: string) {
  const safe = safeHref(href);
  return /^https?:/i.test(safe)
    ? { href: safe, target: "_blank", rel: "noopener noreferrer" }
    : { href: safe };
}
