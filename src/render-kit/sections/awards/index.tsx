import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z
    .array(
      z.object({
        title: textSchema,
        organization: textSchema,
        year: z.string().default(""),
        description: textSchema,
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "list" | "cards"): VariantComponent<Content> =>
  function Awards({ content, ctx }) {
    return (
      <Rail heading={content.heading} ctx={ctx}>
        <ul
          className={`pk-awards__list pk-awards__list--${layout} ${layout === "cards" ? "pk-grid" : ""}`}
        >
          {content.items.map((item, i) => (
            <li key={i} className={layout === "cards" ? "pk-card" : undefined}>
              {item.year && <span className="pk-awards__year">{item.year}</span>}
              <div>
                <h3 className="pk-h3">{ctx.t(item.title)}</h3>
                {ctx.t(item.organization) && (
                  <p className="pk-awards__org">{ctx.t(item.organization)}</p>
                )}
                {ctx.t(item.description) && <p className="pk-muted">{ctx.t(item.description)}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Rail>
    );
  };

export const awards = defineSection({
  type: "awards",
  name: "Awards",
  category: "profile",
  schema,
  defaults: () => ({
    heading: L("Awards", "الجوائز"),
    items: [
      {
        title: L("Best fintech app experience", "أفضل تجربة تطبيق تقنية مالية"),
        organization: L("Egypt Fintech Awards", "جوائز التقنية المالية في مصر"),
        year: "2024",
        description: L("For the Nile Pay wallet redesign.", "عن إعادة تصميم محفظة نايل باي."),
      },
      {
        title: L("Women in design, top 20", "أفضل 20 مصممة"),
        organization: L("Cairo Design Week", "أسبوع القاهرة للتصميم"),
        year: "2022",
        description: "",
      },
    ],
  }),
  variants: {
    list: { name: "List", component: make("list") },
    cards: { name: "Cards", component: make("cards") },
  },
  defaultVariant: "list",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Awards",
      type: "list",
      fields: [
        { key: "title", label: "Award", type: "text" },
        { key: "organization", label: "Given by", type: "text" },
        { key: "year", label: "Year", type: "text" },
        { key: "description", label: "Note", type: "longtext" },
      ],
    },
  ],
});
