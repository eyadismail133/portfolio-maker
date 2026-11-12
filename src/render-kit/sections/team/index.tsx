import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, linkSchema, textSchema } from "../../schema/primitives";
import { L, linkProps, Media, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  members: z
    .array(
      z.object({
        name: textSchema,
        role: textSchema,
        bio: textSchema,
        photo: assetRefSchema.optional(),
        links: z.array(linkSchema).default([]),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

const make = (layout: "grid" | "list"): VariantComponent<Content> =>
  function Team({ content, ctx }) {
    return (
      <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
        <ul className={`pk-team__list pk-team__list--${layout}`}>
          {content.members.map((member, i) => (
            <li key={i}>
              <Media asset={member.photo} label={ctx.t(member.name)} className="pk-team__photo" />
              <div>
                <h3 className="pk-h3">{ctx.t(member.name)}</h3>
                <p className="pk-team__role">{ctx.t(member.role)}</p>
                {ctx.t(member.bio) && <p className="pk-muted">{ctx.rich(member.bio)}</p>}
                {member.links.length > 0 && (
                  <p className="pk-team__links">
                    {member.links.map((link, l) => (
                      <a key={l} className="pk-link" {...linkProps(link.href)}>
                        {ctx.t(link.label)}
                      </a>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Stack>
    );
  };

export const team = defineSection({
  type: "team",
  name: "Team",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("The team", "الفريق"),
    subheading: L(
      "Twelve people in Alexandria. These four will answer your calls.",
      "اثنا عشر شخصاً في الإسكندرية. هؤلاء الأربعة سيردّون على اتصالاتك.",
    ),
    members: [
      {
        name: L("Karim Mansour", "كريم منصور"),
        role: L("Founder and engineer", "المؤسس ومهندس برمجيات"),
        bio: L(
          "Wrote the first version for his mother's dental clinic in 2017.",
          "كتب النسخة الأولى لعيادة والدته لطب الأسنان عام 2017.",
        ),
        links: [{ label: "LinkedIn", href: "https://www.linkedin.com/" }],
      },
      {
        name: L("Salma Fathy", "سلمى فتحي"),
        role: L("Head of customer success", "مديرة نجاح العملاء"),
        bio: L(
          "Former clinic manager. Has trained more than 300 receptionists.",
          "مديرة عيادة سابقة، درّبت أكثر من 300 موظف استقبال.",
        ),
        links: [],
      },
      {
        name: L("Youssef Adel", "يوسف عادل"),
        role: L("Lead developer", "كبير المطورين"),
        bio: L(
          "Keeps the calendar fast with 60 clinics on it.",
          "يحافظ على سرعة التقويم مع 60 عيادة تعمل عليه.",
        ),
        links: [],
      },
      {
        name: L("Mariam Shawky", "مريم شوقي"),
        role: L("Product designer", "مصممة منتجات"),
        bio: L("Designs every screen in Arabic first.", "تصمم كل شاشة بالعربية أولاً."),
        links: [],
      },
    ],
  }),
  variants: {
    grid: { name: "Photo grid", component: make("grid") },
    list: { name: "List", component: make("list") },
  },
  defaultVariant: "grid",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "members",
      label: "People",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "role", label: "Role", type: "text" },
        { key: "bio", label: "Short bio", type: "longtext" },
        { key: "photo", label: "Photo", type: "image" },
        {
          key: "links",
          label: "Links",
          type: "list",
          fields: [
            { key: "label", label: "Label", type: "text" },
            { key: "href", label: "Address", type: "url" },
          ],
        },
      ],
    },
  ],
});
