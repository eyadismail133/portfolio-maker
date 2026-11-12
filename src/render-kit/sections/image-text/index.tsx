import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, linkSchema, textSchema } from "../../schema/primitives";
import { ButtonLink, L, Media, Paragraphs } from "../shared";

const schema = z.object({
  heading: textSchema,
  body: textSchema,
  image: assetRefSchema.optional(),
  button: linkSchema.optional(),
});
type Content = z.output<typeof schema>;

const make = (side: "start" | "end"): VariantComponent<Content> =>
  function ImageText({ content, ctx }) {
    return (
      <div className={`pk-it pk-it--${side}`}>
        <Media asset={content.image} label={ctx.t(content.heading)} className="pk-it__image" />
        <div className="pk-it__copy">
          {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
          <Paragraphs text={ctx.t(content.body)} />
          <ButtonLink link={content.button} ctx={ctx} kind="ghost" />
        </div>
      </div>
    );
  };

export const imageText = defineSection({
  type: "image-text",
  name: "Image with text",
  category: "free",
  schema,
  defaults: () => ({
    heading: L("One day a week at the front desk", "يوم كل أسبوع عند مكتب الاستقبال"),
    body: L(
      "Every Tuesday someone from our team sits next to a receptionist. Most of what we build starts as a note from those mornings.",
      "كل ثلاثاء يجلس أحد أفراد فريقنا بجوار موظف استقبال. أغلب ما نبنيه يبدأ كملاحظة من تلك الصباحات.",
    ),
    button: { label: L("Read how we work", "اقرأ كيف نعمل"), href: "#" },
  }),
  variants: {
    "image-start": { name: "Image first", component: make("start") },
    "image-end": { name: "Text first", component: make("end") },
  },
  defaultVariant: "image-start",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Text", type: "longtext" },
    { key: "image", label: "Image", type: "image" },
    { key: "button", label: "Button", type: "link" },
  ],
});
