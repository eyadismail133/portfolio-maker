import { z } from "zod";
import { safeImageUrl } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Rail, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(z.object({ name: textSchema, description: textSchema, logo: assetRefSchema.optional() }))
    .default([]),
});
type Content = z.output<typeof schema>;
type Item = Content["items"][number];

function Mark({ item, name }: { item: Item; name: string }) {
  const url = safeImageUrl(item.logo?.url);
  return url && item.logo ? (
    <img
      className="pk-partners__logo"
      src={url}
      alt={name}
      width={item.logo.width}
      height={item.logo.height}
      loading="lazy"
    />
  ) : (
    <h3 className="pk-h3">{name}</h3>
  );
}

const Grid: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid pk-partners__grid">
      {content.items.map((item, i) => (
        <li key={i} className="pk-card">
          <Mark item={item} name={ctx.t(item.name)} />
          {ctx.t(item.description) && <p className="pk-muted">{ctx.t(item.description)}</p>}
        </li>
      ))}
    </ul>
  </Stack>
);

const List: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-partners__list">
      {content.items.map((item, i) => (
        <li key={i}>
          <Mark item={item} name={ctx.t(item.name)} />
          {ctx.t(item.description) && <p className="pk-muted">{ctx.t(item.description)}</p>}
        </li>
      ))}
    </ul>
  </Rail>
);

export const partners = defineSection({
  type: "partners",
  name: "Partners",
  category: "business",
  schema,
  defaults: () => ({
    heading: L("Partners", "الشركاء"),
    subheading: L(
      "The companies behind our payments, messages and hosting.",
      "الشركات التي تقف وراء مدفوعاتنا ورسائلنا واستضافتنا.",
    ),
    items: [
      {
        name: L("Paymob", "باي موب"),
        description: L("Card and wallet payments", "الدفع بالبطاقات والمحافظ"),
      },
      {
        name: L("Meta Business", "ميتا للأعمال"),
        description: L("Official WhatsApp reminders", "تذكيرات واتساب الرسمية"),
      },
      {
        name: L("Link Datacenter", "لينك داتا سنتر"),
        description: L("Hosting inside Egypt", "استضافة داخل مصر"),
      },
      {
        name: L("Flat6Labs", "فلات 6 لابز"),
        description: L("Seed investor since 2019", "مستثمر منذ 2019"),
      },
    ],
  }),
  variants: { grid: { name: "Cards", component: Grid }, list: { name: "List", component: List } },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Partners",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "description", label: "What they do with you", type: "text" },
        { key: "logo", label: "Logo", type: "image" },
      ],
    },
  ],
});
