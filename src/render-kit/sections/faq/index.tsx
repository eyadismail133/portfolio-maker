import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Paragraphs, Rail, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z.array(z.object({ question: textSchema, answer: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

const Accordion: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <div className="pk-faq__accordion">
      {content.items.map((item, i) => (
        <details key={i} open={i === 0 || undefined}>
          <summary>
            <h3 className="pk-h3">{ctx.t(item.question)}</h3>
          </summary>
          <Paragraphs text={ctx.t(item.answer)} />
        </details>
      ))}
    </div>
  </Rail>
);

const Columns: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <dl className="pk-faq__columns">
      {content.items.map((item, i) => (
        <div key={i}>
          <dt className="pk-h3">{ctx.t(item.question)}</dt>
          <dd className="pk-muted">{ctx.rich(item.answer)}</dd>
        </div>
      ))}
    </dl>
  </Stack>
);

export const faq = defineSection({
  type: "faq",
  name: "Questions and answers",
  category: "trust",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Questions", "أسئلة شائعة"),
    items: [
      {
        question: L("How long does setup take?", "كم يستغرق الإعداد؟"),
        answer: L(
          "About two weeks from the first visit to the first online booking.",
          "نحو أسبوعين من أول زيارة حتى أول حجز عبر الإنترنت.",
        ),
      },
      {
        question: L("Do patients need to install an app?", "هل يحتاج المرضى إلى تثبيت تطبيق؟"),
        answer: L(
          "No. They book from a link and get reminders on WhatsApp.",
          "لا. يحجزون من رابط وتصلهم التذكيرات على واتساب.",
        ),
      },
      {
        question: L("What happens if the internet goes down?", "ماذا يحدث إذا انقطع الإنترنت؟"),
        answer: L(
          "The front desk keeps working offline and syncs when the connection returns.",
          "يستمر مكتب الاستقبال في العمل دون اتصال، وتتم المزامنة عند عودة الإنترنت.",
        ),
      },
      {
        question: L("Can we leave and take our data?", "هل يمكننا المغادرة وأخذ بياناتنا؟"),
        answer: L(
          "Yes. One button exports everything to Excel, and there is no contract lock-in.",
          "نعم. زر واحد يصدّر كل شيء إلى إكسل، ولا يوجد عقد يلزمك بالبقاء.",
        ),
      },
    ],
  }),
  variants: {
    accordion: { name: "Open and close", component: Accordion },
    columns: { name: "Two columns", component: Columns },
  },
  defaultVariant: "accordion",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Questions",
      type: "list",
      fields: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "longtext" },
      ],
    },
  ],
});
