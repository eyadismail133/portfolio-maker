import type { ReactNode } from "react";
import { safeHref, safeImageUrl } from "../i18n";
import type { SectionContext } from "../registry";
import type { AssetRef, Link, LocalizedText } from "../schema/primitives";

/** Sample text in both languages. */
export const L = (en: string, ar: string) => ({ en, ar });

type HeadProps = {
  heading?: LocalizedText;
  subheading?: LocalizedText;
  ctx: SectionContext;
  children: ReactNode;
};

/** Section layout with the heading in a side column on wide screens. */
export function Rail({ heading, subheading, ctx, children }: HeadProps) {
  const title = ctx.t(heading);
  const sub = ctx.t(subheading);
  return (
    <div className="pk-rail">
      {(title || sub) && (
        <div className="pk-rail__head">
          {title && <h2 className="pk-h2">{title}</h2>}
          {sub && <p className="pk-sub">{sub}</p>}
        </div>
      )}
      <div className="pk-rail__body">{children}</div>
    </div>
  );
}

/** Section layout with the heading above the content. */
export function Stack({ heading, subheading, ctx, children }: HeadProps) {
  const title = ctx.t(heading);
  const sub = ctx.t(subheading);
  return (
    <div className="pk-stack">
      {(title || sub) && (
        <div className="pk-stack__head">
          {title && <h2 className="pk-h2">{title}</h2>}
          {sub && <p className="pk-sub">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Text with line breaks kept as paragraphs. */
export function Paragraphs({ text, className = "pk-prose" }: { text: string; className?: string }) {
  const parts = text.split(/\n+/).filter((p) => p.trim());
  if (parts.length === 0) return null;
  return (
    <div className={className}>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
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
}: {
  asset?: AssetRef;
  label: string;
  className?: string;
}) {
  const url = safeImageUrl(asset?.url);
  if (asset && url) {
    return (
      <img
        className={`pk-media ${className}`}
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
    <div className={`pk-media pk-media--empty ${className}`} aria-hidden="true">
      <span>{initials(label)}</span>
    </div>
  );
}

export function ButtonLink({
  link,
  ctx,
  kind = "primary",
}: {
  link?: Link;
  ctx: SectionContext;
  kind?: "primary" | "ghost";
}) {
  const label = ctx.t(link?.label);
  if (!link || !label) return null;
  return (
    <a className={`pk-btn pk-btn--${kind}`} href={safeHref(link.href)}>
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
