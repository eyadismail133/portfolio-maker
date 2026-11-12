import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  steps: z.array(z.object({ title: textSchema, description: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "horizontal" | "vertical"): VariantComponent<Content> =>
  function HowItWorks({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ol className={`pk-steps pk-steps--${layout}`}>
          {content.steps.map((step, i) => (
            <li key={i}>
              <span className="pk-steps__num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="pk-h3">{ctx.t(step.title)}</h3>
                <p className="pk-muted">{ctx.rich(step.description)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Stack>
    );
  };

export const howItWorks = defineSection({
  type: "how-it-works",
  name: "How it works",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Live in two weeks", "جاهز خلال أسبوعين"),
    steps: [
      {
        title: L("We visit your clinic", "نزور عيادتك"),
        description: L(
          "Half a day at the front desk to see how bookings really happen.",
          "نصف يوم عند مكتب الاستقبال لنرى كيف تتم الحجوزات فعلاً.",
        ),
      },
      {
        title: L("We move your data", "ننقل بياناتك"),
        description: L(
          "Patient lists and future appointments are imported from Excel or paper.",
          "نستورد قوائم المرضى والمواعيد القادمة من إكسل أو من الدفاتر.",
        ),
      },
      {
        title: L("We train your team", "ندرّب فريقك"),
        description: L(
          "Two one-hour sessions. Most receptionists need only the first.",
          "جلستان مدة كل منهما ساعة. أغلب الموظفين يكتفون بالأولى.",
        ),
      },
      {
        title: L("You go live", "تبدأ العمل"),
        description: L(
          "We stay on site for the first morning, then on WhatsApp.",
          "نبقى معك في أول صباح، ثم نتابع عبر واتساب.",
        ),
      },
    ],
  }),
  variants: {
    horizontal: { name: "Side by side", component: make("horizontal") },
    vertical: { name: "Top to bottom", component: make("vertical") },
  },
  defaultVariant: "horizontal",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "steps",
      label: "Steps",
      type: "list",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
      ],
    },
  ],
});
