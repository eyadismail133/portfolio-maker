import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(z.object({ date: textSchema, title: textSchema, description: textSchema }))
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "vertical" | "horizontal"): VariantComponent<Content> =>
  function Timeline({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ol className={`pk-milestones pk-milestones--${layout}`}>
          {content.items.map((item, i) => (
            <li key={i}>
              <p className="pk-milestones__date">{ctx.t(item.date)}</p>
              <div>
                <h3 className="pk-h3">{ctx.t(item.title)}</h3>
                {ctx.t(item.description) && <p className="pk-muted">{ctx.t(item.description)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Stack>
    );
  };

export const timeline = defineSection({
  type: "timeline",
  name: "Timeline",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Our story so far", "قصتنا حتى الآن"),
    items: [
      {
        date: "2017",
        title: L("First clinic", "أول عيادة"),
        description: L(
          "A booking page for one dental clinic in Smouha.",
          "صفحة حجز لعيادة أسنان واحدة في سموحة.",
        ),
      },
      {
        date: "2019",
        title: L("Ten clinics", "عشر عيادات"),
        description: L(
          "Karim leaves his job and hires the first two engineers.",
          "كريم يترك وظيفته ويعيّن أول مهندسَين.",
        ),
      },
      {
        date: "2022",
        title: L("Payments", "المدفوعات"),
        description: L(
          "Card and wallet payments at the front desk.",
          "الدفع بالبطاقة والمحفظة عند الاستقبال.",
        ),
      },
      {
        date: "2025",
        title: L("Sixty clinics, two cities", "ستون عيادة في مدينتين"),
        description: L(
          "An office in Cairo and the millionth appointment.",
          "مكتب في القاهرة والموعد رقم مليون.",
        ),
      },
      {
        date: "2026",
        title: L("Next: lab results", "القادم: نتائج التحاليل"),
        description: L(
          "Results sent straight to the patient's file.",
          "إرسال النتائج مباشرة إلى ملف المريض.",
        ),
      },
    ],
  }),
  variants: {
    vertical: { name: "Top to bottom", component: make("vertical") },
    horizontal: { name: "Side by side", component: make("horizontal") },
  },
  defaultVariant: "vertical",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Moments",
      type: "list",
      fields: [
        { key: "date", label: "Date", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
      ],
    },
  ],
});
