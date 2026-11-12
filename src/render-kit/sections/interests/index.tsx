import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { Icon } from "../icons";
import { L, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z.array(z.object({ name: textSchema, icon: z.string().default("star") })).default([]),
});
type Content = z.output<typeof schema>;

const Icons: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <ul className="pk-interests__list">
      {content.items.map((item, i) => (
        <li key={i}>
          <Icon name={item.icon} />
          <span>{ctx.t(item.name)}</span>
        </li>
      ))}
    </ul>
  </Rail>
);

const Tags: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <ul className="pk-tags">
      {content.items.map((item, i) => (
        <li key={i}>{ctx.t(item.name)}</li>
      ))}
    </ul>
  </Rail>
);

export const interests = defineSection({
  type: "interests",
  name: "Interests",
  category: "profile",
  schema,
  defaults: () => ({
    heading: L("Outside work", "خارج العمل"),
    items: [
      { name: L("Film photography", "التصوير بالأفلام"), icon: "camera" },
      { name: L("Arabic calligraphy", "الخط العربي"), icon: "pen" },
      { name: L("Oud", "العود"), icon: "music" },
      { name: L("Teaching", "التدريس"), icon: "book" },
    ],
  }),
  variants: {
    icons: { name: "With icons", component: Icons },
    tags: { name: "Tags", component: Tags },
  },
  defaultVariant: "icons",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Interests",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "icon", label: "Icon", type: "icon" },
      ],
    },
  ],
});
