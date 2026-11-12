import { z } from "zod";
import { defineSection, type SectionContext, type VariantComponent } from "../../registry";
import { endMonthSchema, monthSchema, textSchema } from "../../schema/primitives";
import { EntryCards, EntryTimeline, type Entry } from "../entries";
import { L, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        role: textSchema,
        company: textSchema,
        location: textSchema,
        start: monthSchema,
        end: endMonthSchema,
        description: textSchema,
        achievements: z.array(textSchema).default([]),
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

function toEntries(content: Content, ctx: SectionContext): Entry[] {
  return content.items.map((item) => ({
    title: ctx.t(item.role),
    place: ctx.t(item.company),
    location: ctx.t(item.location),
    start: item.start,
    end: item.end,
    body: ctx.t(item.description),
    points: item.achievements.map((a) => ctx.t(a)).filter(Boolean),
  }));
}

const Timeline: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <EntryTimeline entries={toEntries(content, ctx)} ctx={ctx} />
  </Rail>
);

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <EntryCards entries={toEntries(content, ctx)} ctx={ctx} />
  </Rail>
);

export const workExperience = defineSection({
  type: "work-experience",
  name: "Work experience",
  category: "profile",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Experience", "الخبرة العملية"),
    items: [
      {
        role: L("Lead product designer", "قائدة تصميم المنتجات"),
        company: L("Nile Pay", "نايل باي"),
        location: L("Cairo", "القاهرة"),
        start: "2022-03",
        end: "current",
        description: L(
          "I run design for the consumer wallet, used by 2.1 million people each month.",
          "أدير تصميم المحفظة الإلكترونية للأفراد التي يستخدمها 2.1 مليون شخص شهرياً.",
        ),
        achievements: [
          L(
            "Cut failed transfers by 38% by redesigning the confirmation step",
            "خفّضت التحويلات الفاشلة بنسبة 38% بإعادة تصميم خطوة التأكيد",
          ),
          L(
            "Built the design system now shared by four product teams",
            "بنيت نظام التصميم الذي تستخدمه الآن أربعة فرق",
          ),
        ],
      },
      {
        role: L("Product designer", "مصممة منتجات"),
        company: L("Masary Bank", "بنك مساري"),
        location: L("Cairo", "القاهرة"),
        start: "2019-01",
        end: "2022-02",
        description: L(
          "Designed the first mobile banking app for a bank with 140 branches.",
          "صممت أول تطبيق بنكي للهاتف لبنك لديه 140 فرعاً.",
        ),
        achievements: [
          L(
            "Account opening went from 3 branch visits to 9 minutes on a phone",
            "فتح الحساب أصبح يستغرق 9 دقائق على الهاتف بدلاً من 3 زيارات للفرع",
          ),
        ],
      },
      {
        role: L("Junior UX designer", "مصممة تجربة مستخدم مبتدئة"),
        company: L("Studio Kiosk", "استوديو كشك"),
        location: L("Alexandria", "الإسكندرية"),
        start: "2017-06",
        end: "2018-12",
        description: L(
          "Websites and booking flows for clinics and schools.",
          "مواقع وأنظمة حجز لعيادات ومدارس.",
        ),
        achievements: [],
      },
    ],
  }),
  variants: {
    timeline: { name: "Timeline", component: Timeline },
    cards: { name: "Cards", component: Cards },
  },
  defaultVariant: "timeline",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Jobs",
      type: "list",
      fields: [
        { key: "role", label: "Role", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "location", label: "Location", type: "text" },
        { key: "start", label: "Start", type: "month" },
        { key: "end", label: "End", type: "end-month" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "achievements", label: "Achievements", type: "text-list" },
      ],
    },
  ],
});
