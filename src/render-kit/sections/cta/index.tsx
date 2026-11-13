import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { linkSchema, textSchema } from "../../schema/primitives";
import { ButtonLink, L } from "../shared";

const schema = z.object({ heading: textSchema, body: textSchema, button: linkSchema.optional() });
type Content = z.output<typeof schema>;

const make = (layout: "banner" | "minimal" | "card" | "statement"): VariantComponent<Content> =>
  function Cta({ content, ctx }) {
    return (
      <div className={`pk-cta__box pk-cta__box--${layout}`}>
        <div>
          <h2 className="pk-h2">{ctx.t(content.heading)}</h2>
          {ctx.t(content.body) && <p className="pk-sub">{ctx.rich(content.body)}</p>}
        </div>
        <ButtonLink link={content.button} ctx={ctx} />
      </div>
    );
  };

export const cta = defineSection({
  type: "cta",
  name: "Call to action",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("Have a product that confuses people?", "لديك منتج يربك مستخدميه؟"),
    body: L(
      "Send me the screen that causes the most support calls.",
      "أرسل لي الشاشة التي تسبب أكبر عدد من مكالمات الدعم.",
    ),
    button: { label: L("Start a conversation", "ابدأ المحادثة"), href: "#contact" },
  }),
  variants: {
    banner: { name: "Color banner", component: make("banner") },
    minimal: { name: "Plain", component: make("minimal") },
    card: { name: "Centered card", component: make("card") },
    statement: { name: "Big statement", component: make("statement") },
  },
  defaultVariant: "banner",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Short text", type: "longtext" },
    { key: "button", label: "Button", type: "link" },
  ],
});
