import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { linkSchema, textSchema } from "../../schema/primitives";
import { ButtonLink, L, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  plans: z
    .array(
      z.object({
        name: textSchema,
        price: textSchema,
        period: textSchema,
        description: textSchema,
        features: z.array(textSchema).default([]),
        button: linkSchema.optional(),
        featured: z.boolean().default(false),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid pk-pricing__cards">
      {content.plans.map((plan, i) => (
        <li key={i} className="pk-card pk-plan" data-featured={plan.featured ? "" : undefined}>
          {plan.featured && <p className="pk-plan__badge">{ctx.ui("popular")}</p>}
          <h3 className="pk-h3">{ctx.t(plan.name)}</h3>
          <p className="pk-plan__price">
            <strong>{ctx.t(plan.price)}</strong> <span>{ctx.t(plan.period)}</span>
          </p>
          {ctx.t(plan.description) && <p className="pk-muted">{ctx.rich(plan.description)}</p>}
          <ul className="pk-points">
            {plan.features.map((feature, f) => (
              <li key={f}>{ctx.t(feature)}</li>
            ))}
          </ul>
          <ButtonLink link={plan.button} ctx={ctx} kind={plan.featured ? "primary" : "ghost"} />
        </li>
      ))}
    </ul>
  </Stack>
);

const Table: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-pricing__table">
      {content.plans.map((plan, i) => (
        <li key={i} className="pk-plan" data-featured={plan.featured ? "" : undefined}>
          <div>
            <h3 className="pk-h3">
              {ctx.t(plan.name)}
              {plan.featured && <span className="pk-plan__badge">{ctx.ui("popular")}</span>}
            </h3>
            {ctx.t(plan.description) && <p className="pk-muted">{ctx.rich(plan.description)}</p>}
          </div>
          <p className="pk-muted">
            {plan.features
              .map((f) => ctx.t(f))
              .filter(Boolean)
              .join(ctx.lang === "ar" ? "، " : ", ")}
          </p>
          <p className="pk-plan__price">
            <strong>{ctx.t(plan.price)}</strong> <span>{ctx.t(plan.period)}</span>
          </p>
          <ButtonLink link={plan.button} ctx={ctx} kind={plan.featured ? "primary" : "ghost"} />
        </li>
      ))}
    </ul>
  </Stack>
);

export const pricing = defineSection({
  type: "pricing",
  name: "Pricing",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Pricing", "الأسعار"),
    subheading: L(
      "Per branch, per month. Setup and training are included.",
      "لكل فرع شهرياً. الإعداد والتدريب مشمولان.",
    ),
    plans: [
      {
        name: L("Solo", "فردي"),
        price: L("EGP 4,500", "4,500 جنيه"),
        period: L("a month", "شهرياً"),
        description: L("For one doctor with one front desk.", "لطبيب واحد ومكتب استقبال واحد."),
        features: [
          L("Online booking", "حجز عبر الإنترنت"),
          L("WhatsApp reminders", "تذكيرات واتساب"),
          L("1 calendar", "تقويم واحد"),
        ],
        button: { label: L("Start with Solo", "ابدأ بالباقة الفردية"), href: "#contact" },
        featured: false,
      },
      {
        name: L("Clinic", "عيادة"),
        price: L("EGP 9,000", "9,000 جنيه"),
        period: L("a month", "شهرياً"),
        description: L(
          "For up to eight doctors in one branch.",
          "لما يصل إلى ثمانية أطباء في فرع واحد.",
        ),
        features: [
          L("Everything in Solo", "كل ما في الباقة الفردية"),
          L("Patient records", "سجلات المرضى"),
          L("Payments at the desk", "الدفع عند الاستقبال"),
          L("Daily owner report", "تقرير يومي للمالك"),
        ],
        button: { label: L("Start with Clinic", "ابدأ بباقة العيادة"), href: "#contact" },
        featured: true,
      },
      {
        name: L("Group", "مجموعة"),
        price: L("Custom", "حسب الطلب"),
        period: "",
        description: L("For several branches or a hospital.", "لعدة فروع أو مستشفى."),
        features: [
          L("Everything in Clinic", "كل ما في باقة العيادة"),
          L("One calendar across branches", "تقويم موحد للفروع"),
          L("A named support engineer", "مهندس دعم مخصص"),
        ],
        button: { label: L("Talk to us", "تحدث معنا"), href: "#contact" },
        featured: false,
      },
    ],
  }),
  variants: {
    cards: { name: "Cards", component: Cards },
    table: { name: "Rows", component: Table },
  },
  defaultVariant: "cards",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "plans",
      label: "Plans",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "period", label: "Period", type: "text" },
        { key: "description", label: "Who it is for", type: "text" },
        { key: "features", label: "What is included", type: "text-list" },
        { key: "button", label: "Button", type: "link" },
        { key: "featured", label: "Highlight this plan", type: "toggle" },
      ],
    },
  ],
});
