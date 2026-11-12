import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Rail } from "../shared";

const LEVELS = ["basic", "intermediate", "advanced", "fluent", "native"] as const;

const schema = z.object({
  heading: textSchema,
  items: z
    .array(z.object({ name: textSchema, level: z.enum(LEVELS).default("fluent") }))
    .default([]),
});
type Content = z.output<typeof schema>;

const Dots: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <ul className="pk-langs pk-langs--dots">
      {content.items.map((item, i) => {
        const score = LEVELS.indexOf(item.level) + 1;
        return (
          <li key={i}>
            <span className="pk-langs__name">{ctx.t(item.name)}</span>
            <span className="pk-dots" aria-hidden="true">
              {LEVELS.map((_, d) => (
                <i key={d} data-on={d < score ? "" : undefined} />
              ))}
            </span>
            <span className="pk-langs__level">{ctx.ui(item.level)}</span>
          </li>
        );
      })}
    </ul>
  </Rail>
);

const List: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} ctx={ctx}>
    <ul className="pk-langs pk-langs--list">
      {content.items.map((item, i) => (
        <li key={i}>
          <span className="pk-langs__name">{ctx.t(item.name)}</span>
          <span className="pk-langs__level">{ctx.ui(item.level)}</span>
        </li>
      ))}
    </ul>
  </Rail>
);

export const languages = defineSection({
  type: "languages",
  name: "Languages",
  category: "profile",
  schema,
  defaults: () => ({
    heading: L("Languages", "اللغات"),
    items: [
      { name: L("Arabic", "العربية"), level: "native" as const },
      { name: L("English", "الإنجليزية"), level: "fluent" as const },
      { name: L("French", "الفرنسية"), level: "intermediate" as const },
    ],
  }),
  variants: {
    dots: { name: "Dots", component: Dots },
    list: { name: "Simple list", component: List },
  },
  defaultVariant: "dots",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "items",
      label: "Languages",
      type: "list",
      fields: [
        { key: "name", label: "Language", type: "text" },
        { key: "level", label: "Level", type: "select", options: LEVELS },
      ],
    },
  ],
});
