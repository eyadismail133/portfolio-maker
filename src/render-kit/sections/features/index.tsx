import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { Icon } from "../icons";
import { L, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        icon: z.string().default("check"),
        title: textSchema,
        description: textSchema,
        image: assetRefSchema.optional(),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const Grid: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid pk-features__grid">
      {content.items.map((item, i) => (
        <li key={i}>
          <Icon name={item.icon} />
          <h3 className="pk-h3">{ctx.t(item.title)}</h3>
          <p className="pk-muted">{ctx.rich(item.description)}</p>
        </li>
      ))}
    </ul>
  </Stack>
);

const Rows: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-features__rows">
      {content.items.map((item, i) => (
        <li key={i}>
          <Media asset={item.image} label={ctx.t(item.title)} className="pk-features__image" />
          <div>
            <h3 className="pk-h3">{ctx.t(item.title)}</h3>
            <p className="pk-muted">{ctx.rich(item.description)}</p>
          </div>
        </li>
      ))}
    </ul>
  </Stack>
);

export const features = defineSection({
  type: "features",
  name: "Features",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Built for a busy front desk", "مصمم لمكتب استقبال مزدحم"),
    items: [
      {
        icon: "bolt",
        title: L("Book in 20 seconds", "احجز في 20 ثانية"),
        description: L(
          "Search a patient by phone number and pick a slot. No forms.",
          "ابحث عن المريض برقم هاتفه واختر الموعد. بلا نماذج.",
        ),
      },
      {
        icon: "globe",
        title: L("Arabic first", "العربية أولاً"),
        description: L(
          "Every screen and every printed receipt works in Arabic and English.",
          "كل شاشة وكل إيصال مطبوع يعمل بالعربية والإنجليزية.",
        ),
      },
      {
        icon: "lock",
        title: L("Your data stays yours", "بياناتك ملكك"),
        description: L(
          "Hosted in Egypt, encrypted, and exportable to Excel at any time.",
          "مستضافة في مصر، مشفّرة، ويمكن تصديرها إلى إكسل في أي وقت.",
        ),
      },
      {
        icon: "phone",
        title: L("Works on any phone", "يعمل على أي هاتف"),
        description: L(
          "Doctors see tomorrow's list from home without installing anything.",
          "يرى الأطباء قائمة الغد من المنزل دون تثبيت أي شيء.",
        ),
      },
      {
        icon: "users",
        title: L("One calendar for every branch", "تقويم واحد لكل الفروع"),
        description: L(
          "Move a doctor between branches and the bookings follow.",
          "انقل الطبيب بين الفروع وستنتقل معه الحجوزات.",
        ),
      },
      {
        icon: "chart",
        title: L("Numbers you can act on", "أرقام تبني عليها قراراتك"),
        description: L(
          "See no-shows, busiest hours and revenue per doctor each morning.",
          "تابع عدم الحضور وساعات الذروة وإيراد كل طبيب كل صباح.",
        ),
      },
    ],
  }),
  variants: {
    grid: { name: "Icon grid", component: Grid },
    rows: { name: "Rows with images", component: Rows },
  },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Features",
      type: "list",
      fields: [
        { key: "icon", label: "Icon", type: "icon" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "image", label: "Image", type: "image" },
      ],
    },
  ],
});
