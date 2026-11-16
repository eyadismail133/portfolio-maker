import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, listItem, textSchema } from "../../schema/primitives";
import { L, Media, Stack, sub } from "../shared";

/** Pro showcase: tiles of different sizes fitted together, like a bento box. */
const SIZES = ["small", "wide", "tall", "big"] as const;

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      listItem({
        title: textSchema,
        text: textSchema,
        image: assetRefSchema.optional(),
        size: z.enum(SIZES).default("small"),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "grid" | "mosaic"): VariantComponent<Content> =>
  function Bento({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ul className={`pk-bento pk-bento--${layout}`}>
          {content.items.map((item, i) => (
            <li key={i} {...ctx.el(item.id, "pk-card pk-bento__tile")} data-size={item.size}>
              {item.image && (
                <Media
                  ctx={ctx}
                  elKey={sub(item.id, "image")}
                  asset={item.image}
                  label={ctx.t(item.title)}
                  className="pk-bento__image"
                />
              )}
              <h3 className="pk-h3">{ctx.t(item.title)}</h3>
              {ctx.t(item.text) && <p className="pk-bento__text">{ctx.rich(item.text)}</p>}
            </li>
          ))}
        </ul>
      </Stack>
    );
  };

/** What a live page shows once its owner is no longer Pro: plain cards of one size. */
const Plain: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid">
      {content.items.map((item, i) => (
        <li key={i} {...ctx.el(item.id, "pk-card")}>
          <h3 className="pk-h3">{ctx.t(item.title)}</h3>
          <p className="pk-muted">{ctx.rich(item.text)}</p>
        </li>
      ))}
    </ul>
  </Stack>
);

export const showcaseBento = defineSection({
  type: "showcase-bento",
  name: "Bento grid",
  category: "showcase",
  pro: true,
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Everything the front desk needs", "كل ما يحتاجه مكتب الاستقبال"),
    subheading: L("One screen instead of four notebooks.", "شاشة واحدة بدلاً من أربعة دفاتر."),
    items: [
      {
        title: L("Bookings that fill themselves", "حجوزات تملأ نفسها"),
        text: L(
          "Patients pick a time from a link. The calendar updates while you answer the phone.",
          "يختار المرضى الموعد من رابط، ويتحدّث التقويم وأنت ترد على الهاتف.",
        ),
        size: "big" as const,
      },
      {
        title: L("Reminders on WhatsApp", "تذكيرات على واتساب"),
        text: L("Missed visits fell by a third.", "قلّت المواعيد الفائتة بمقدار الثلث."),
        size: "wide" as const,
      },
      {
        title: L("Records in one place", "السجلات في مكان واحد"),
        text: L(
          "Visits, prescriptions and results per patient.",
          "الزيارات والوصفات والنتائج لكل مريض.",
        ),
        size: "small" as const,
      },
      {
        title: L("Daily report", "تقرير يومي"),
        text: L(
          "Revenue and visits at six in the evening.",
          "الإيرادات والزيارات في السادسة مساءً.",
        ),
        size: "small" as const,
      },
      {
        title: L("Works offline", "يعمل دون إنترنت"),
        text: L(
          "The desk keeps working when the internet drops and syncs when it is back.",
          "يستمر المكتب في العمل عند انقطاع الإنترنت ويتزامن عند عودته.",
        ),
        size: "tall" as const,
      },
      {
        title: L("Arabic and English", "العربية والإنجليزية"),
        text: L("Every screen in both languages.", "كل شاشة باللغتين."),
        size: "wide" as const,
      },
    ],
  }),
  variants: {
    grid: { name: "Four across", component: make("grid") },
    mosaic: { name: "Mosaic with a colored lead", component: make("mosaic") },
  },
  defaultVariant: "grid",
  fallback: Plain,
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Tiles",
      type: "list",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "text", label: "Text", type: "longtext" },
        { key: "image", label: "Picture (optional)", type: "image" },
        { key: "size", label: "Size", type: "select", options: SIZES },
      ],
    },
  ],
});
