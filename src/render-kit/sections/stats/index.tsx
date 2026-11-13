import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z.array(z.object({ value: textSchema, label: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "row" | "cards" | "big"): VariantComponent<Content> =>
  function Stats({ content, ctx }) {
    return (
      <>
        {ctx.t(content.heading) && (
          <h2 className="pk-h2 pk-stats__heading">{ctx.t(content.heading)}</h2>
        )}
        <dl className={`pk-stats__list pk-stats__list--${layout}`}>
          {content.items.map((item, i) => (
            <div key={i} className={layout === "cards" ? "pk-card" : undefined}>
              <dd>{ctx.t(item.value)}</dd>
              <dt>{ctx.t(item.label)}</dt>
            </div>
          ))}
        </dl>
      </>
    );
  };

export const stats = defineSection({
  type: "stats",
  name: "Numbers",
  category: "business",
  schema,
  defaults: () => ({
    heading: "",
    items: [
      { value: "63", label: L("clinics using Marsa", "عيادة تستخدم مرسى") },
      { value: L("1.4M", "1.4 مليون"), label: L("appointments booked", "موعد تم حجزه") },
      { value: "7%", label: L("average no-show rate", "متوسط نسبة عدم الحضور") },
      { value: L("9 yrs", "9 سنوات"), label: L("building for clinics", "في خدمة العيادات") },
    ],
  }),
  variants: {
    row: { name: "Row", component: make("row") },
    cards: { name: "Cards", component: make("cards") },
    big: { name: "Big numbers", component: make("big") },
  },
  defaultVariant: "row",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Numbers",
      type: "list",
      fields: [
        { key: "value", label: "Number", type: "text" },
        { key: "label", label: "Label", type: "text" },
      ],
    },
  ],
});
