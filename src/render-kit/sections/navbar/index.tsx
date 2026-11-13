import { z } from "zod";
import { safeImageUrl } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, linkSchema, textSchema } from "../../schema/primitives";
import { L, linkProps } from "../shared";

const schema = z.object({
  brand: textSchema,
  logo: assetRefSchema.optional(),
  logoSize: z.enum(["small", "medium", "large"]).default("medium"),
  /** Link to every section that has a heading. */
  autoLinks: z.boolean().default(true),
  links: z.array(linkSchema).default([]),
  cta: linkSchema.optional(),
});
type Content = z.output<typeof schema>;

const Nav: VariantComponent<Content> = ({ content, ctx }) => {
  const brand = ctx.t(content.brand);
  const logo = safeImageUrl(content.logo?.url);
  const links = [
    ...(content.autoLinks ? ctx.nav.map((n) => ({ label: n.label, href: `#${n.id}` })) : []),
    ...content.links.map((l) => ({ label: ctx.t(l.label), href: l.href })).filter((l) => l.label),
  ];
  const cta = ctx.t(content.cta?.label);
  const switches = ctx.languageLinks.map((l) => (
    <a key={l.lang} className="pk-nav__lang" href={l.href} lang={l.lang} hrefLang={l.lang}>
      {l.label}
    </a>
  ));
  const items = links.map((l, i) => (
    <li key={i}>
      <a {...linkProps(l.href)}>{l.label}</a>
    </li>
  ));
  return (
    <nav className="pk-nav" aria-label={ctx.ui("menu")}>
      <a className="pk-nav__brand" href="#" data-pk-logo-size={content.logoSize}>
        {logo && (
          <img
            className="pk-nav__logo"
            src={logo}
            alt={brand ? "" : content.logo?.alt || ctx.ui("logo")}
            width={content.logo?.width}
            height={content.logo?.height}
          />
        )}
        {brand && <span>{brand}</span>}
      </a>
      {links.length > 0 && <ul className="pk-nav__links">{items}</ul>}
      {switches}
      {cta && content.cta && (
        <a
          className="pk-btn pk-btn--primary pk-btn--small pk-nav__cta"
          {...linkProps(content.cta.href)}
        >
          {cta}
        </a>
      )}
      {links.length > 0 && (
        <details className="pk-nav__menu">
          <summary>{ctx.ui("menu")}</summary>
          <ul>{items}</ul>
        </details>
      )}
    </nav>
  );
};

export const navbar = defineSection({
  type: "navbar",
  name: "Navigation bar",
  category: "start",
  pinned: "top",
  schema,
  defaults: () => ({
    brand: L("Layla Hassan", "ليلى حسن"),
    autoLinks: true,
    links: [],
    cta: { label: L("Email me", "راسلني"), href: "mailto:hello@example.com" },
  }),
  variants: {
    simple: { name: "Name left, links right", component: Nav },
    centered: { name: "Centered", component: Nav },
  },
  defaultVariant: "simple",
  fields: [
    { key: "brand", label: "Name or brand", type: "text" },
    { key: "logo", label: "Logo", type: "image" },
    { key: "logoSize", label: "Logo size", type: "select", options: ["small", "medium", "large"] },
    { key: "autoLinks", label: "Link to page sections automatically", type: "toggle" },
    {
      key: "links",
      label: "Extra links",
      type: "list",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "Address", type: "url" },
      ],
    },
    { key: "cta", label: "Button", type: "link" },
  ],
});
