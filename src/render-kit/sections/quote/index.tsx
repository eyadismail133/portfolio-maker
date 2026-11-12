import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L } from "../shared";

const schema = z.object({ quote: textSchema, author: textSchema, role: textSchema });
type Content = z.output<typeof schema>;

const make = (layout: "simple" | "boxed"): VariantComponent<Content> =>
  function Quote({ content, ctx }) {
    return (
      <figure
        className={`pk-bigquote pk-bigquote--${layout} ${layout === "boxed" ? "pk-card" : ""}`}
      >
        <blockquote>
          <p>{ctx.rich(content.quote)}</p>
        </blockquote>
        {ctx.t(content.author) && (
          <figcaption>
            <strong>{ctx.t(content.author)}</strong>
            {ctx.t(content.role) && <span className="pk-muted">{ctx.t(content.role)}</span>}
          </figcaption>
        )}
      </figure>
    );
  };

export const quote = defineSection({
  type: "quote",
  name: "Quote",
  category: "free",
  schema,
  defaults: () => ({
    quote: L(
      "If a receptionist needs training to book an appointment, we designed it wrong.",
      "إذا احتاج موظف الاستقبال إلى تدريب ليحجز موعداً، فقد أخطأنا في التصميم.",
    ),
    author: L("Karim Mansour", "كريم منصور"),
    role: L("Founder, Marsa", "مؤسس مرسى"),
  }),
  variants: {
    simple: { name: "Plain", component: make("simple") },
    boxed: { name: "In a box", component: make("boxed") },
  },
  defaultVariant: "simple",
  fields: [
    { key: "quote", label: "Quote", type: "longtext" },
    { key: "author", label: "Who said it", type: "text" },
    { key: "role", label: "Role", type: "text" },
  ],
});
