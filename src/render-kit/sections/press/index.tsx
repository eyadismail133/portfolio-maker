import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z
    .array(z.object({ outlet: textSchema, quote: textSchema, url: z.string().default("") }))
    .default([]),
});
type Content = z.output<typeof schema>;

const Logos: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-press__row">
    {ctx.t(content.heading) && <p className="pk-muted">{ctx.t(content.heading)}</p>}
    <ul className="pk-logos">
      {content.items.map((item, i) => (
        <li key={i}>
          {item.url ? <a {...linkProps(item.url)}>{ctx.t(item.outlet)}</a> : ctx.t(item.outlet)}
        </li>
      ))}
    </ul>
  </div>
);

const Quotes: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} ctx={ctx}>
    <ul className="pk-grid pk-press__quotes">
      {content.items.map((item, i) => (
        <li key={i} className="pk-card">
          <blockquote>{ctx.rich(item.quote)}</blockquote>
          <p className="pk-press__outlet">{ctx.t(item.outlet)}</p>
          {item.url && (
            <a className="pk-link" {...linkProps(item.url)}>
              {ctx.ui("readArticle")}
            </a>
          )}
        </li>
      ))}
    </ul>
  </Stack>
);

export const press = defineSection({
  type: "press",
  name: "Press",
  category: "business",
  schema,
  defaults: () => ({
    heading: L("In the news", "في الإعلام"),
    items: [
      {
        outlet: L("Enterprise", "إنتربرايز"),
        quote: L(
          "The Alexandria startup that made clinic queues shorter.",
          "الشركة السكندرية الناشئة التي قصّرت طوابير العيادات.",
        ),
        url: "#",
      },
      {
        outlet: L("Wamda", "ومضة"),
        quote: L(
          "Marsa shows that boring software can be a very good business.",
          "مرسى تثبت أن البرامج البسيطة يمكن أن تكون عملاً ناجحاً جداً.",
        ),
        url: "#",
      },
      {
        outlet: L("Al-Mal", "المال"),
        quote: L(
          "Sixty clinics and not a single paper diary left.",
          "ستون عيادة ولم يبقَ فيها دفتر ورقي واحد.",
        ),
        url: "#",
      },
    ],
  }),
  variants: {
    quotes: { name: "Quote cards", component: Quotes },
    logos: { name: "Names in a row", component: Logos },
  },
  defaultVariant: "quotes",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Mentions",
      type: "list",
      fields: [
        { key: "outlet", label: "Publication", type: "text" },
        { key: "quote", label: "Quote", type: "longtext" },
        { key: "url", label: "Link", type: "url" },
      ],
    },
  ],
});
