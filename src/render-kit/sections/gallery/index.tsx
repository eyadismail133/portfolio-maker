import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z.array(z.object({ image: assetRefSchema.optional(), caption: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "grid" | "masonry" | "slider"): VariantComponent<Content> =>
  function Gallery({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ul
          className={`pk-gallery__list pk-gallery__list--${layout}${layout === "slider" ? " pk-slider" : ""}`}
        >
          {content.items.map((item, i) => (
            <li key={i}>
              <figure>
                <Media
                  asset={item.image}
                  label={ctx.t(item.caption) || String(i + 1)}
                  className="pk-gallery__image"
                />
                {ctx.t(item.caption) && <figcaption>{ctx.t(item.caption)}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </Stack>
    );
  };

export const gallery = defineSection({
  type: "gallery",
  name: "Gallery",
  category: "work",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Gallery", "معرض الصور"),
    subheading: L(
      "Screens, sketches and workshop photos.",
      "شاشات ورسومات أولية وصور من ورش العمل.",
    ),
    items: [
      { caption: L("Wallet home screen", "الشاشة الرئيسية للمحفظة") },
      { caption: L("Paper prototypes", "نماذج ورقية") },
      { caption: L("Testing day in Giza", "يوم الاختبار في الجيزة") },
      { caption: L("Component library", "مكتبة المكونات") },
      { caption: L("Transfer flow", "مسار التحويل") },
      { caption: L("Team workshop", "ورشة الفريق") },
    ],
  }),
  variants: {
    grid: { name: "Even grid", component: make("grid") },
    masonry: { name: "Mixed sizes", component: make("masonry") },
    slider: { name: "Side-scrolling row", component: make("slider") },
  },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Images",
      type: "list",
      fields: [
        { key: "image", label: "Image", type: "image" },
        { key: "caption", label: "Caption", type: "text" },
      ],
    },
  ],
});
