import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { linkSchema, textSchema } from "../../schema/primitives";
import { L, linkProps } from "../shared";

const schema = z.object({
  name: textSchema,
  tagline: textSchema,
  links: z.array(linkSchema).default([]),
  copyright: textSchema,
});
type Content = z.output<typeof schema>;

const make = (layout: "simple" | "columns"): VariantComponent<Content> =>
  function Footer({ content, ctx }) {
    const links = content.links.filter((l) => ctx.t(l.label));
    return (
      <div className={`pk-footer__inner pk-footer__inner--${layout}`}>
        <div>
          <p className="pk-footer__name">{ctx.t(content.name)}</p>
          {layout === "columns" && ctx.t(content.tagline) && (
            <p className="pk-footer__tagline">{ctx.t(content.tagline)}</p>
          )}
        </div>
        {links.length > 0 && (
          <ul className="pk-footer__links">
            {links.map((l, i) => (
              <li key={i}>
                <a {...linkProps(l.href)}>{ctx.t(l.label)}</a>
              </li>
            ))}
          </ul>
        )}
        {ctx.t(content.copyright) && <p className="pk-footer__copy">{ctx.t(content.copyright)}</p>}
      </div>
    );
  };

export const footer = defineSection({
  type: "footer",
  name: "Footer",
  category: "free",
  pinned: "bottom",
  schema,
  defaults: () => ({
    name: L("Layla Hassan", "ليلى حسن"),
    tagline: L("Product designer in Cairo", "مصممة منتجات في القاهرة"),
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Behance", href: "https://www.behance.net/" },
      { label: L("Email", "البريد"), href: "mailto:hello@example.com" },
    ],
    copyright: L("© 2026 Layla Hassan", "© 2026 ليلى حسن"),
  }),
  variants: {
    simple: { name: "One line", component: make("simple") },
    columns: { name: "With tagline", component: make("columns") },
  },
  defaultVariant: "simple",
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "tagline", label: "Tagline", type: "text" },
    {
      key: "links",
      label: "Links",
      type: "list",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Address", type: "url" },
      ],
    },
    { key: "copyright", label: "Copyright line", type: "text" },
  ],
});
