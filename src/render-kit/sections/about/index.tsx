import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Media, Paragraphs, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  body: textSchema,
  image: assetRefSchema.optional(),
  facts: z.array(z.object({ label: textSchema, value: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

function Facts({ content, ctx }: Parameters<VariantComponent<Content>>[0]) {
  if (content.facts.length === 0) return null;
  return (
    <dl className="pk-facts">
      {content.facts.map((fact, i) => (
        <div key={i}>
          <dt>{ctx.t(fact.label)}</dt>
          <dd>{ctx.t(fact.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

const WithPhoto: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <div className="pk-about__grid">
      <Media asset={content.image} label={ctx.t(content.heading)} className="pk-about__image" />
      <div>
        <Paragraphs text={ctx.t(content.body)} />
        <Facts content={content} ctx={ctx} />
      </div>
    </div>
  </Rail>
);

const TextOnly: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <Paragraphs text={ctx.t(content.body)} className="pk-prose pk-prose--large" />
    <Facts content={content} ctx={ctx} />
  </Rail>
);

const Banner: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-about__banner">
    {content.image && (
      <Media asset={content.image} label={ctx.t(content.heading)} className="pk-about__wide" />
    )}
    <div className="pk-about__split">
      <div>
        {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
        <Paragraphs text={ctx.t(content.body)} className="pk-prose pk-prose--large" />
      </div>
      {content.facts.length > 0 && (
        <div className="pk-card pk-about__card">
          <Facts content={content} ctx={ctx} />
        </div>
      )}
    </div>
  </div>
);

export const about = defineSection({
  type: "about",
  name: "About",
  category: "profile",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("About", "نبذة عني"),
    body: L(
      "I started as a bank teller, which is where I learned how confusing money screens can be. Today I lead design for a payments team and spend one day a week testing with real customers.\nOutside work I teach a free design class for students at Cairo University.",
      "بدأت مسيرتي موظفة في بنك، وهناك تعلّمت كم يمكن أن تكون شاشات المعاملات المالية مربكة. اليوم أقود التصميم في فريق مدفوعات وأخصص يوماً كل أسبوع للاختبار مع عملاء حقيقيين.\nخارج العمل أقدّم درساً مجانياً في التصميم لطلاب جامعة القاهرة.",
    ),
    facts: [
      { label: L("Based in", "الإقامة"), value: L("Cairo, Egypt", "القاهرة، مصر") },
      { label: L("Experience", "الخبرة"), value: L("8 years", "8 سنوات") },
      {
        label: L("Works with", "أعمل مع"),
        value: L("Fintech and banking teams", "فرق التقنية المالية والبنوك"),
      },
    ],
  }),
  variants: {
    photo: { name: "Text with photo", component: WithPhoto },
    text: { name: "Text only", component: TextOnly },
    banner: { name: "Wide photo and facts card", component: Banner },
  },
  defaultVariant: "text",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Your story", type: "longtext" },
    { key: "image", label: "Photo", type: "image" },
    {
      key: "facts",
      label: "Quick facts",
      type: "list",
      fields: [
        { key: "label", label: "Label", type: "text" },
        { key: "value", label: "Value", type: "text" },
      ],
    },
  ],
});
