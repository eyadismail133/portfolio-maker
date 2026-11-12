import { z } from "zod";
import { safeFormAction } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L } from "../shared";

const schema = z.object({
  heading: textSchema,
  body: textSchema,
  /** Address of the mailing list form (Mailchimp, Brevo, Formspree...). */
  action: z.string().default(""),
  buttonLabel: textSchema,
  note: textSchema,
});
type Content = z.output<typeof schema>;

const make = (layout: "inline" | "card"): VariantComponent<Content> =>
  function Newsletter({ content, ctx }) {
    return (
      <div className={`pk-news pk-news--${layout} ${layout === "card" ? "pk-card" : ""}`}>
        <div>
          <h2 className="pk-h2">{ctx.t(content.heading)}</h2>
          {ctx.t(content.body) && <p className="pk-sub">{ctx.rich(content.body)}</p>}
        </div>
        <form className="pk-news__form" action={safeFormAction(content.action)} method="post">
          <label>
            <span className="pk-visually-hidden">{ctx.ui("yourEmail")}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={ctx.ui("yourEmail")}
              required
            />
          </label>
          <button type="submit" className="pk-btn pk-btn--primary">
            {ctx.t(content.buttonLabel) || ctx.ui("subscribe")}
          </button>
          {ctx.t(content.note) && <p className="pk-news__note">{ctx.t(content.note)}</p>}
        </form>
      </div>
    );
  };

export const newsletter = defineSection({
  type: "newsletter",
  name: "Newsletter or waitlist",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("Get the monthly clinic report", "احصل على تقرير العيادات الشهري"),
    body: L(
      "One email a month with numbers from 63 clinics: no-shows, busiest hours, average wait.",
      "رسالة واحدة شهرياً بأرقام من 63 عيادة: عدم الحضور، ساعات الذروة، ومتوسط الانتظار.",
    ),
    action: "",
    buttonLabel: L("Send me the report", "أرسل لي التقرير"),
    note: L("No ads. Unsubscribe with one click.", "بلا إعلانات. إلغاء الاشتراك بضغطة واحدة."),
  }),
  variants: {
    inline: { name: "Text beside form", component: make("inline") },
    card: { name: "Centered card", component: make("card") },
  },
  defaultVariant: "inline",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Short text", type: "longtext" },
    { key: "action", label: "Mailing list form address", type: "url" },
    { key: "buttonLabel", label: "Button text", type: "text" },
    { key: "note", label: "Small note under the form", type: "text" },
  ],
});
