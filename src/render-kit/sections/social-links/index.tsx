import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z
    .array(
      z.object({ label: textSchema, handle: z.string().default(""), href: z.string().default("") }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "row" | "cards"): VariantComponent<Content> =>
  function SocialLinks({ content, ctx }) {
    return (
      <div className="pk-social">
        {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
        <ul
          className={`pk-social__list pk-social__list--${layout} ${layout === "cards" ? "pk-grid" : ""}`}
        >
          {content.items.map((item, i) => (
            <li key={i}>
              <a className={layout === "cards" ? "pk-card" : undefined} {...linkProps(item.href)}>
                <strong>{ctx.t(item.label)}</strong>
                {item.handle && <bdi dir="ltr">{item.handle}</bdi>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

export const socialLinks = defineSection({
  type: "social-links",
  name: "Social links",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("Find me online", "تابعني على الإنترنت"),
    items: [
      { label: "LinkedIn", handle: "in/laylahassan", href: "https://www.linkedin.com/" },
      { label: "Behance", handle: "laylahassan", href: "https://www.behance.net/" },
      { label: "Dribbble", handle: "@layla", href: "https://dribbble.com/" },
      { label: "Instagram", handle: "@layla.designs", href: "https://www.instagram.com/" },
    ],
  }),
  variants: {
    row: { name: "Row", component: make("row") },
    cards: { name: "Cards", component: make("cards") },
  },
  defaultVariant: "row",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Profiles",
      type: "list",
      fields: [
        { key: "label", label: "Site", type: "text" },
        { key: "handle", label: "Your name there", type: "text" },
        { key: "href", label: "Address", type: "url" },
      ],
    },
  ],
});
