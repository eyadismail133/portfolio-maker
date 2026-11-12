import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps, Rail, Stack } from "../shared";

const KINDS = ["article", "paper", "talk", "book", "podcast"] as const;

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        title: textSchema,
        venue: textSchema,
        year: z.string().default(""),
        kind: z.enum(KINDS).default("article"),
        url: z.string().default(""),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;
type Item = Content["items"][number];

function Entry({
  item,
  ctx,
}: {
  item: Item;
  ctx: Parameters<VariantComponent<Content>>[0]["ctx"];
}) {
  const title = ctx.t(item.title);
  const action = item.kind === "talk" || item.kind === "podcast" ? "watch" : "read";
  return (
    <>
      <p className="pk-publications__meta">
        {[ctx.t(item.venue), item.year].filter(Boolean).join(ctx.lang === "ar" ? "، " : ", ")}
      </p>
      <h3 className="pk-h3">
        {item.url ? (
          <a {...linkProps(item.url)} className="pk-publications__title">
            {title}
          </a>
        ) : (
          title
        )}
      </h3>
      {item.url && (
        <a
          className="pk-link pk-publications__more"
          {...linkProps(item.url)}
          aria-hidden="true"
          tabIndex={-1}
        >
          {ctx.ui(action)}
        </a>
      )}
    </>
  );
}

const List: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ol className="pk-publications__list">
      {content.items.map((item, i) => (
        <li key={i} data-pk-kind={item.kind}>
          <Entry item={item} ctx={ctx} />
        </li>
      ))}
    </ol>
  </Rail>
);

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <ul className="pk-grid pk-publications__cards">
      {content.items.map((item, i) => (
        <li key={i} className="pk-card" data-pk-kind={item.kind}>
          <Entry item={item} ctx={ctx} />
        </li>
      ))}
    </ul>
  </Stack>
);

export const publications = defineSection({
  type: "publications",
  name: "Publications and talks",
  category: "profile",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Writing and talks", "كتابات ومحاضرات"),
    subheading: L("Where I share what I learn.", "حيث أشارك ما أتعلمه."),
    items: [
      {
        title: L("Why people abandon money transfers", "لماذا يترك الناس التحويلات المالية"),
        venue: L("UX Collective", "UX Collective"),
        year: "2025",
        kind: "article" as const,
        url: "",
      },
      {
        title: L("Designing for Arabic first", "التصميم للعربية أولاً"),
        venue: L("Cairo UX Meetup", "ملتقى القاهرة لتجربة المستخدم"),
        year: "2024",
        kind: "talk" as const,
        url: "",
      },
      {
        title: L(
          "Trust signals in mobile banking: a study of 400 users",
          "مؤشرات الثقة في الخدمات المصرفية عبر الهاتف: دراسة على 400 مستخدم",
        ),
        venue: L("Journal of Interaction Design", "مجلة تصميم التفاعل"),
        year: "2023",
        kind: "paper" as const,
        url: "",
      },
    ],
  }),
  variants: {
    list: { name: "List", component: List },
    cards: { name: "Cards", component: Cards },
  },
  defaultVariant: "list",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Items",
      type: "list",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "venue", label: "Where it appeared", type: "text" },
        { key: "year", label: "Year", type: "text" },
        { key: "kind", label: "Kind", type: "select", options: KINDS },
        { key: "url", label: "Link", type: "url" },
      ],
    },
  ],
});
