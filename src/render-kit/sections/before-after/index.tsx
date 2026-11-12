import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  before: assetRefSchema.optional(),
  after: assetRefSchema.optional(),
  beforeLabel: textSchema,
  afterLabel: textSchema,
  caption: textSchema,
});
type Content = z.output<typeof schema>;

/**
 * Both images side by side. On a published page the script turns the slider variant into one
 * image with a handle to drag; without the script it stays side by side.
 */
const make = (layout: "slider" | "side"): VariantComponent<Content> =>
  function BeforeAfter({ content, ctx }) {
    const before = ctx.t(content.beforeLabel) || ctx.ui("before");
    const after = ctx.t(content.afterLabel) || ctx.ui("after");
    const caption = ctx.t(content.caption);
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <figure className="pk-before-after__figure">
          <div
            className="pk-before-after__compare"
            data-pk-compare={layout === "slider" ? "" : undefined}
            data-pk-compare-label={ctx.ui("compare")}
          >
            <div className="pk-before-after__pane">
              <Media asset={content.before} label={before} className="pk-before-after__image" />
              <span className="pk-before-after__label">{before}</span>
            </div>
            <div className="pk-before-after__pane">
              <Media asset={content.after} label={after} className="pk-before-after__image" />
              <span className="pk-before-after__label">{after}</span>
            </div>
          </div>
          {caption && <figcaption className="pk-muted">{caption}</figcaption>}
        </figure>
      </Stack>
    );
  };

export const beforeAfter = defineSection({
  type: "before-after",
  name: "Before and after",
  category: "work",
  schema,
  defaults: () => ({
    heading: L("Before and after", "قبل وبعد"),
    subheading: L(
      "The same reception area, three weeks apart.",
      "منطقة الاستقبال نفسها، بفارق ثلاثة أسابيع.",
    ),
    beforeLabel: L("Before", "قبل"),
    afterLabel: L("After", "بعد"),
    caption: L(
      "New lighting, one long counter and room for twelve chairs instead of six.",
      "إضاءة جديدة ومكتب استقبال واحد طويل ومكان لاثني عشر كرسياً بدلاً من ستة.",
    ),
  }),
  variants: {
    slider: { name: "Slider", component: make("slider") },
    side: { name: "Side by side", component: make("side") },
  },
  defaultVariant: "slider",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    { key: "before", label: "Before image", type: "image" },
    { key: "after", label: "After image", type: "image" },
    { key: "beforeLabel", label: "Before label", type: "text" },
    { key: "afterLabel", label: "After label", type: "text" },
    { key: "caption", label: "Caption", type: "longtext" },
  ],
});
