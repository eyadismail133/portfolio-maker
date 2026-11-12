import { z } from "zod";
import { formatMonth } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { monthSchema, textSchema } from "../../schema/primitives";
import { L, linkProps, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z
    .array(
      z.object({
        name: textSchema,
        issuer: textSchema,
        date: monthSchema,
        url: z.string().default(""),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "cards" | "list"): VariantComponent<Content> =>
  function Certificates({ content, ctx }) {
    return (
      <Rail heading={content.heading} ctx={ctx}>
        <ul className={`pk-certs pk-certs--${layout} ${layout === "cards" ? "pk-grid" : ""}`}>
          {content.items.map((item, i) => (
            <li key={i} className={layout === "cards" ? "pk-card" : undefined}>
              <div>
                <h3 className="pk-h3">{ctx.t(item.name)}</h3>
                <p className="pk-muted">
                  {[ctx.t(item.issuer), formatMonth(item.date, ctx.lang)]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              {item.url && (
                <a className="pk-link" {...linkProps(item.url)}>
                  {ctx.ui("viewCertificate")}
                </a>
              )}
            </li>
          ))}
        </ul>
      </Rail>
    );
  };

export const certificates = defineSection({
  type: "certificates",
  name: "Certificates",
  category: "profile",
  schema,
  defaults: () => ({
    heading: L("Certificates", "الشهادات"),
    items: [
      {
        name: L("Google UX Design Certificate", "شهادة جوجل في تصميم تجربة المستخدم"),
        issuer: "Google",
        date: "2020-06",
        url: "#",
      },
      {
        name: L("Certified Usability Analyst", "محلل قابلية استخدام معتمد"),
        issuer: "Human Factors International",
        date: "2022-11",
        url: "#",
      },
      {
        name: L("Accessibility for designers", "إتاحة الوصول للمصممين"),
        issuer: "Deque University",
        date: "2023-03",
        url: "",
      },
    ],
  }),
  variants: {
    cards: { name: "Cards", component: make("cards") },
    list: { name: "List", component: make("list") },
  },
  defaultVariant: "list",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Certificates",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "issuer", label: "Issued by", type: "text" },
        { key: "date", label: "Date", type: "month" },
        { key: "url", label: "Link", type: "url" },
      ],
    },
  ],
});
