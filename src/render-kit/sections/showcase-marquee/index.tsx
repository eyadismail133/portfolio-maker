import { z } from "zod";
import { defineSection, type SectionContext, type VariantComponent } from "../../registry";
import { listItem, textSchema } from "../../schema/primitives";
import { L } from "../shared";

/**
 * Pro showcase: a band of words or tags that moves across the page (CSS only). It stands still,
 * wrapped, with reduced motion or the page's animation set to none, and runs the other way on
 * Arabic pages.
 */
const SPEEDS = ["slow", "normal", "fast"] as const;

const schema = z.object({
  heading: textSchema,
  items: z.array(listItem({ text: textSchema })).default([]),
  speed: z.enum(SPEEDS).default("normal"),
});
type Content = z.output<typeof schema>;

function Track({
  content,
  ctx,
  reverse = false,
}: {
  content: Content;
  ctx: SectionContext;
  reverse?: boolean;
}) {
  const words = content.items.filter((item) => ctx.t(item.text));
  if (words.length === 0) return null;
  // The list is drawn twice so the loop has no gap; the copy is hidden from screen readers.
  return (
    <div className={`pk-marquee__track${reverse ? " pk-marquee__track--reverse" : ""}`}>
      <ul className="pk-marquee__list">
        {words.map((item, i) => (
          <li key={i} {...ctx.el(item.id)}>
            {ctx.t(item.text)}
          </li>
        ))}
      </ul>
      <ul className="pk-marquee__list pk-marquee__copy" aria-hidden="true">
        {words.map((item, i) => (
          <li key={i}>{ctx.t(item.text)}</li>
        ))}
      </ul>
    </div>
  );
}

const make = (layout: "words" | "tags"): VariantComponent<Content> =>
  function Marquee({ content, ctx }) {
    return (
      <div className={`pk-marquee pk-marquee--${layout}`} data-pk-speed={content.speed}>
        {ctx.t(content.heading) && (
          <p {...ctx.el("heading", "pk-marquee__label")}>{ctx.t(content.heading)}</p>
        )}
        <Track content={content} ctx={ctx} />
        {layout === "tags" && <Track content={content} ctx={ctx} reverse />}
      </div>
    );
  };

/** What a live page shows once its owner is no longer Pro: the words standing still. */
const Plain: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-marquee pk-marquee--still">
    {ctx.t(content.heading) && (
      <p {...ctx.el("heading", "pk-marquee__label")}>{ctx.t(content.heading)}</p>
    )}
    <ul className="pk-marquee__list">
      {content.items
        .filter((item) => ctx.t(item.text))
        .map((item, i) => (
          <li key={i} {...ctx.el(item.id)}>
            {ctx.t(item.text)}
          </li>
        ))}
    </ul>
  </div>
);

export const showcaseMarquee = defineSection({
  type: "showcase-marquee",
  name: "Moving band",
  category: "showcase",
  pro: true,
  schema,
  defaults: () => ({
    heading: L("What we do every day", "ما نفعله كل يوم"),
    items: [
      { text: L("Product design", "تصميم المنتجات") },
      { text: L("Design systems", "أنظمة التصميم") },
      { text: L("User research", "أبحاث المستخدمين") },
      { text: L("Prototypes", "النماذج الأولية") },
      { text: L("Arabic interfaces", "واجهات عربية") },
    ],
    speed: "normal" as const,
  }),
  variants: {
    words: { name: "Big words", component: make("words") },
    tags: { name: "Two rows of tags", component: make("tags") },
  },
  defaultVariant: "words",
  fallback: Plain,
  fields: [
    { key: "heading", label: "Small label", type: "text" },
    {
      key: "items",
      label: "Words",
      type: "list",
      fields: [{ key: "text", label: "Word or short phrase", type: "text" }],
    },
    { key: "speed", label: "Speed", type: "select", options: SPEEDS },
  ],
});
