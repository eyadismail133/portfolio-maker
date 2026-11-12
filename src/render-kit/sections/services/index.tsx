import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { Icon } from "../icons";
import { L, Rail, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        icon: z.string().default("star"),
        title: textSchema,
        description: textSchema,
        price: textSchema,
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid pk-services__cards">
      {content.items.map((item, i) => (
        <li key={i} className="pk-card">
          <Icon name={item.icon} />
          <h3 className="pk-h3">{ctx.t(item.title)}</h3>
          <p className="pk-muted">{ctx.rich(item.description)}</p>
          {ctx.t(item.price) && <p className="pk-services__price">{ctx.t(item.price)}</p>}
        </li>
      ))}
    </ul>
  </Stack>
);

const List: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-services__list">
      {content.items.map((item, i) => (
        <li key={i}>
          <div>
            <h3 className="pk-h3">{ctx.t(item.title)}</h3>
            <p className="pk-muted">{ctx.rich(item.description)}</p>
          </div>
          {ctx.t(item.price) && <p className="pk-services__price">{ctx.t(item.price)}</p>}
        </li>
      ))}
    </ul>
  </Rail>
);

export const services = defineSection({
  type: "services",
  name: "Services",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("What we do", "ماذا نقدّم"),
    subheading: L(
      "Three services, one team, fixed prices.",
      "ثلاث خدمات، فريق واحد، وأسعار ثابتة.",
    ),
    items: [
      {
        icon: "clock",
        title: L("Online booking", "الحجز عبر الإنترنت"),
        description: L(
          "Patients book and reschedule on their phone. Reminders go out on WhatsApp.",
          "يحجز المرضى ويغيّرون مواعيدهم من الهاتف، وتصلهم التذكيرات على واتساب.",
        ),
        price: L("From EGP 4,500 a month", "من 4,500 جنيه شهرياً"),
      },
      {
        icon: "shield",
        title: L("Patient records", "سجلات المرضى"),
        description: L(
          "Visits, prescriptions and lab results in one encrypted file per patient.",
          "الزيارات والوصفات ونتائج التحاليل في ملف واحد مشفّر لكل مريض.",
        ),
        price: L("From EGP 7,000 a month", "من 7,000 جنيه شهرياً"),
      },
      {
        icon: "chart",
        title: L("Payments and reports", "المدفوعات والتقارير"),
        description: L(
          "Card and wallet payments at the desk, with a daily revenue report for the owner.",
          "دفع بالبطاقة والمحفظة عند الاستقبال، مع تقرير إيرادات يومي لصاحب العيادة.",
        ),
        price: L("1.9% per payment", "1.9% لكل عملية"),
      },
    ],
  }),
  variants: {
    cards: { name: "Cards", component: Cards },
    list: { name: "List with prices", component: List },
  },
  defaultVariant: "cards",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Services",
      type: "list",
      fields: [
        { key: "icon", label: "Icon", type: "icon" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "price", label: "Price", type: "text" },
      ],
    },
  ],
});
