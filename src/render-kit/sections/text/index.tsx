import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Paragraphs, Rail } from "../shared";

const schema = z.object({ heading: textSchema, body: textSchema });
type Content = z.output<typeof schema>;

const Left: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <Paragraphs text={ctx.t(content.body)} />
  </Rail>
);

const Centered: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-text__center">
    {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
    <Paragraphs text={ctx.t(content.body)} />
  </div>
);

export const text = defineSection({
  type: "text",
  name: "Text",
  category: "free",
  schema,
  defaults: () => ({
    heading: L("How I work", "كيف أعمل"),
    body: L(
      "I start every project by watching five people use what exists today. Then I sketch on paper, test a rough prototype within a week, and only then open the design tool.\nI work best with teams that let designers talk to customers.",
      "أبدأ كل مشروع بمراقبة خمسة أشخاص وهم يستخدمون ما هو موجود اليوم. ثم أرسم على الورق، وأختبر نموذجاً أولياً خلال أسبوع، وبعدها فقط أفتح أداة التصميم.\nأعمل بأفضل شكل مع الفرق التي تسمح للمصممين بالتحدث مع العملاء.",
    ),
  }),
  variants: {
    left: { name: "Heading beside text", component: Left },
    centered: { name: "Centered", component: Centered },
  },
  defaultVariant: "left",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Text", type: "longtext" },
  ],
});
