import { z } from "zod";
import { defineSection, type SectionContext, type VariantComponent } from "../../registry";
import { endMonthSchema, monthSchema, textSchema } from "../../schema/primitives";
import { EntryCards, EntryCompact, EntryTimeline, type Entry } from "../entries";
import { L, Rail } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  items: z
    .array(
      z.object({
        degree: textSchema,
        school: textSchema,
        location: textSchema,
        start: monthSchema,
        end: endMonthSchema,
        grade: textSchema,
        notes: textSchema,
      }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

function toEntries(content: Content, ctx: SectionContext): Entry[] {
  return content.items.map((item) => ({
    title: ctx.t(item.degree),
    place: ctx.t(item.school),
    location: ctx.t(item.location),
    start: item.start,
    end: item.end,
    body: ctx.t(item.notes),
    points: [ctx.t(item.grade)].filter(Boolean),
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

const Compact: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    <EntryCompact entries={toEntries(content, ctx)} ctx={ctx} />
  </Rail>
);

export const education = defineSection({
  type: "education",
  name: "Education",
  category: "profile",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Education", "التعليم"),
    items: [
      {
        degree: L("BSc in Computer Science", "بكالوريوس علوم الحاسب"),
        school: L("Cairo University", "جامعة القاهرة"),
        location: L("Giza", "الجيزة"),
        start: "2013",
        end: "2017",
        grade: L("Graduated with honours, 3.7 GPA", "تخرجت بمرتبة الشرف بمعدل 3.7"),
        notes: L(
          "Graduation project: a queue app for public hospitals.",
          "مشروع التخرج: تطبيق لتنظيم الطوابير في المستشفيات الحكومية.",
        ),
      },
      {
        degree: L("Interaction design diploma", "دبلومة تصميم التفاعل"),
        school: L("Information Technology Institute", "معهد تكنولوجيا المعلومات"),
        location: L("Smart Village", "القرية الذكية"),
        start: "2018",
        end: "2018",
        grade: "",
        notes: L("Nine-month full-time programme.", "برنامج بدوام كامل لمدة تسعة أشهر."),
      },
    ],
  }),
  variants: {
    timeline: { name: "Timeline", component: Timeline },
    cards: { name: "Cards", component: Cards },
    compact: { name: "Compact list", component: Compact },
  },
  defaultVariant: "cards",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "items",
      label: "Studies",
      type: "list",
      fields: [
        { key: "degree", label: "Degree or course", type: "text" },
        { key: "school", label: "School", type: "text" },
        { key: "location", label: "Location", type: "text" },
        { key: "start", label: "Start", type: "month" },
        { key: "end", label: "End", type: "end-month" },
        { key: "grade", label: "Grade", type: "text" },
        { key: "notes", label: "Notes", type: "longtext" },
      ],
    },
  ],
});
