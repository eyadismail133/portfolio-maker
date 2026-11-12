import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z
    .array(
      z.object({
        quote: textSchema,
        name: textSchema,
        role: textSchema,
        photo: assetRefSchema.optional(),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;
type Item = Content["items"][number];
type Ctx = Parameters<VariantComponent<Content>>[0]["ctx"];

function Quote({ item, ctx, className }: { item: Item; ctx: Ctx; className: string }) {
  return (
    <figure className={className}>
      <blockquote>
        <p>{ctx.t(item.quote)}</p>
      </blockquote>
      <figcaption>
        <Media asset={item.photo} label={ctx.t(item.name)} className="pk-testi__photo" />
        <span>
          <strong>{ctx.t(item.name)}</strong>
          {ctx.t(item.role) && <span className="pk-testi__role">{ctx.t(item.role)}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} ctx={ctx}>
    <div className="pk-testis">
      {content.items.map((item, i) => (
        <Quote key={i} item={item} ctx={ctx} className="pk-card pk-testi" />
      ))}
    </div>
  </Stack>
);

const Single: VariantComponent<Content> = ({ content, ctx }) => {
  const first = content.items[0];
  if (!first) return null;
  return (
    <>
      {ctx.t(content.heading) && <h2 className="pk-visually-hidden">{ctx.t(content.heading)}</h2>}
      <Quote item={first} ctx={ctx} className="pk-testi pk-testi--large" />
    </>
  );
};

export const testimonials = defineSection({
  type: "testimonials",
  name: "Testimonials",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("What colleagues say", "ماذا يقول الزملاء"),
    items: [
      {
        quote: L(
          "Layla is the only designer I have worked with who shows up to a review with the support tickets printed out.",
          "ليلى هي المصممة الوحيدة التي عملت معها وتأتي إلى اجتماع المراجعة ومعها شكاوى العملاء مطبوعة.",
        ),
        name: L("Omar El-Sayed", "عمر السيد"),
        role: L("Head of Product, Nile Pay", "مدير المنتجات، نايل باي"),
      },
      {
        quote: L(
          "She made our engineers care about the Arabic layout. That had never happened before.",
          "جعلت مهندسينا يهتمون بالواجهة العربية، وهذا لم يحدث من قبل.",
        ),
        name: L("Nour Abdelrahman", "نور عبد الرحمن"),
        role: L("Engineering manager, Masary Bank", "مديرة الهندسة، بنك مساري"),
      },
    ],
  }),
  variants: {
    cards: { name: "Cards", component: Cards },
    single: { name: "One large quote", component: Single },
  },
  defaultVariant: "cards",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Quotes",
      type: "list",
      fields: [
        { key: "quote", label: "Quote", type: "longtext" },
        { key: "name", label: "Name", type: "text" },
        { key: "role", label: "Role and company", type: "text" },
        { key: "photo", label: "Photo", type: "image" },
      ],
    },
  ],
});
