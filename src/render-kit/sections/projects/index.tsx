import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, linkProps, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        title: textSchema,
        description: textSchema,
        image: assetRefSchema.optional(),
        tags: z.array(textSchema).default([]),
        url: z.string().default(""),
        year: z.string().default(""),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

function Project({
  item,
  ctx,
}: {
  item: Content["items"][number];
  ctx: Parameters<VariantComponent<Content>>[0]["ctx"];
}) {
  const title = ctx.t(item.title);
  const tags = item.tags.map((tag) => ctx.t(tag)).filter(Boolean);
  return (
    <li className="pk-project">
      <Media asset={item.image} label={title} className="pk-project__image" />
      <div className="pk-project__body">
        <div className="pk-project__top">
          <h3 className="pk-h3">{title}</h3>
          {item.year && <span className="pk-project__year">{item.year}</span>}
        </div>
        {ctx.t(item.description) && (
          <p className="pk-project__text">{ctx.rich(item.description)}</p>
        )}
        {tags.length > 0 && (
          <ul className="pk-tags pk-tags--small">
            {tags.map((tag, i) => (
              <li key={i}>{tag}</li>
            ))}
          </ul>
        )}
        {item.url && (
          <a className="pk-link" {...linkProps(item.url)}>
            {ctx.ui("viewProject")}
            <span className="pk-visually-hidden">: {title}</span>
          </a>
        )}
      </div>
    </li>
  );
}

const make = (layout: "grid" | "rows"): VariantComponent<Content> =>
  function Projects({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ul className={`pk-projects__list pk-projects__list--${layout}`}>
          {content.items.map((item, i) => (
            <Project key={i} item={item} ctx={ctx} />
          ))}
        </ul>
      </Stack>
    );
  };

export const projects = defineSection({
  type: "projects",
  name: "Projects",
  category: "work",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Selected work", "أعمال مختارة"),
    subheading: L("Three projects where the numbers moved.", "ثلاثة مشاريع تغيّرت فيها الأرقام."),
    items: [
      {
        title: L("Nile Pay wallet", "محفظة نايل باي"),
        description: L(
          "A full redesign of sending money. Two taps fewer, and support calls about transfers fell by a third.",
          "إعادة تصميم كاملة لتجربة تحويل الأموال. خطوتان أقل، وانخفضت مكالمات الدعم الخاصة بالتحويلات بمقدار الثلث.",
        ),
        tags: [L("Mobile app", "تطبيق هاتف"), L("Payments", "مدفوعات")],
        url: "#",
        year: "2024",
      },
      {
        title: L("Masary account opening", "فتح الحساب في بنك مساري"),
        description: L(
          "Opening a bank account with a national ID and a selfie, tested with 60 first-time customers.",
          "فتح حساب بنكي ببطاقة الرقم القومي وصورة شخصية، بعد اختباره مع 60 عميلاً جديداً.",
        ),
        tags: [L("Banking", "بنوك"), L("Research", "بحث")],
        url: "#",
        year: "2021",
      },
      {
        title: L("Sanad design system", "نظام التصميم «سند»"),
        description: L(
          "120 components that work in Arabic and English from one source, with documentation developers read.",
          "120 مكوّناً تعمل بالعربية والإنجليزية من مصدر واحد، مع توثيق يقرؤه المطوّرون فعلاً.",
        ),
        tags: [L("Design system", "نظام تصميم"), L("RTL", "عربي")],
        url: "#",
        year: "2023",
      },
    ],
  }),
  variants: {
    grid: { name: "Grid", component: make("grid") },
    rows: { name: "Large rows", component: make("rows") },
  },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Projects",
      type: "list",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "image", label: "Image", type: "image" },
        { key: "tags", label: "Tags", type: "text-list" },
        { key: "url", label: "Link", type: "url" },
        { key: "year", label: "Year", type: "text" },
      ],
    },
  ],
});
