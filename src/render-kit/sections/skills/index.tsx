import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  groups: z
    .array(
      z.object({
        name: textSchema,
        items: z
          .array(z.object({ name: textSchema, level: z.number().int().min(1).max(5).optional() }))
          .default([]),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const Bars: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <div className="pk-skills__groups">
      {content.groups.map((group, g) => (
        <div key={g}>
          {ctx.t(group.name) && <h3 className="pk-h3">{ctx.t(group.name)}</h3>}
          <ul className="pk-skills__bars">
            {group.items.map((item, i) => {
              const level = item.level ?? 3;
              return (
                <li key={i}>
                  <span>{ctx.t(item.name)}</span>
                  <span
                    className="pk-meter"
                    role="img"
                    aria-label={`${level} / 5`}
                    style={{ ["--pk-level" as string]: String(level / 5) }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  </Rail>
);

const Tags: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <div className="pk-skills__rows">
      {content.groups.map((group, g) => (
        <div key={g} className="pk-skills__row">
          {ctx.t(group.name) && <h3 className="pk-h3">{ctx.t(group.name)}</h3>}
          <ul className="pk-tags">
            {group.items.map((item, i) => (
              <li key={i}>{ctx.t(item.name)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Rail>
);

export const skills = defineSection({
  type: "skills",
  name: "Skills",
  category: "profile",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Skills", "المهارات"),
    groups: [
      {
        name: L("Design", "التصميم"),
        items: [
          { name: L("Interaction design", "تصميم التفاعل"), level: 5 },
          { name: L("Design systems", "أنظمة التصميم"), level: 5 },
          { name: L("Prototyping", "النماذج الأولية"), level: 4 },
          { name: L("Arabic and bilingual layout", "التصميم العربي وثنائي اللغة"), level: 5 },
        ],
      },
      {
        name: L("Research", "البحث"),
        items: [
          { name: L("Usability testing", "اختبارات قابلية الاستخدام"), level: 5 },
          { name: L("Customer interviews", "مقابلات العملاء"), level: 4 },
          { name: L("Survey analysis", "تحليل الاستبيانات"), level: 3 },
        ],
      },
      {
        name: L("Tools", "الأدوات"),
        items: [
          { name: "Figma", level: 5 },
          { name: "HTML & CSS", level: 4 },
          { name: "Maze", level: 3 },
        ],
      },
    ],
  }),
  variants: {
    bars: { name: "Level bars", component: Bars },
    tags: { name: "Tags", component: Tags },
  },
  defaultVariant: "tags",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "groups",
      label: "Skill groups",
      type: "list",
      fields: [
        { key: "name", label: "Group name", type: "text" },
        {
          key: "items",
          label: "Skills",
          type: "list",
          fields: [
            { key: "name", label: "Skill", type: "text" },
            { key: "level", label: "Level", type: "level" },
          ],
        },
      ],
    },
  ],
});
