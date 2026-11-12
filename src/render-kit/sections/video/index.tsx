import { z } from "zod";
import { videoEmbedUrl } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z.array(z.object({ url: z.string().default(""), title: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "single" | "grid"): VariantComponent<Content> =>
  function Video({ content, ctx }) {
    const items = layout === "single" ? content.items.slice(0, 1) : content.items;
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ul className={`pk-video__list pk-video__list--${layout}`}>
          {items.map((item, i) => {
            const src = videoEmbedUrl(item.url);
            const title = ctx.t(item.title);
            return (
              <li key={i}>
                {src ? (
                  <iframe
                    className="pk-embed"
                    src={src}
                    title={title || "Video"}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="pk-embed pk-video__empty">{ctx.ui("addVideo")}</div>
                )}
                {title && <p className="pk-video__title">{title}</p>}
              </li>
            );
          })}
        </ul>
      </Stack>
    );
  };

export const video = defineSection({
  type: "video",
  name: "Video",
  category: "work",
  schema,
  defaults: () => ({
    heading: L("Watch", "شاهد"),
    subheading: L("A talk and a product walkthrough.", "محاضرة وجولة داخل المنتج."),
    items: [
      {
        url: "",
        title: L(
          "Designing money screens people trust, Cairo UX Meetup",
          "تصميم شاشات مالية يثق بها الناس، ملتقى القاهرة لتجربة المستخدم",
        ),
      },
      { url: "", title: L("Nile Pay in two minutes", "نايل باي في دقيقتين") },
    ],
  }),
  variants: {
    single: { name: "One large video", component: make("single") },
    grid: { name: "Grid", component: make("grid") },
  },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Videos",
      type: "list",
      fields: [
        { key: "url", label: "YouTube or Vimeo link", type: "url" },
        { key: "title", label: "Title", type: "text" },
      ],
    },
  ],
});
