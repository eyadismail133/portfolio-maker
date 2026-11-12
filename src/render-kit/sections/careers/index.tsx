import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps, Paragraphs, Rail, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  subheading: textSchema,
  jobs: z
    .array(
      z.object({
        title: textSchema,
        location: textSchema,
        type: textSchema,
        description: textSchema,
        href: z.string().default(""),
      }),
    )
    .default([]),
  /** Shown when there are no jobs, for example "Send your CV to jobs@…". */
  note: textSchema,
});
type Content = z.output<typeof schema>;
type Ctx = Parameters<VariantComponent<Content>>[0]["ctx"];

function Job({ job, ctx }: { job: Content["jobs"][number]; ctx: Ctx }) {
  const meta = [ctx.t(job.location), ctx.t(job.type)]
    .filter(Boolean)
    .join(ctx.lang === "ar" ? "، " : ", ");
  return (
    <>
      <div className="pk-careers__head">
        <h3 className="pk-h3">{ctx.t(job.title)}</h3>
        {meta && <p className="pk-careers__meta">{meta}</p>}
      </div>
      {ctx.t(job.description) && (
        <Paragraphs text={ctx.t(job.description)} className="pk-prose pk-muted" />
      )}
      {job.href && (
        <a
          className="pk-btn pk-btn--ghost pk-btn--small pk-careers__apply"
          {...linkProps(job.href)}
        >
          {ctx.ui("apply")}
        </a>
      )}
    </>
  );
}

function Empty({ content, ctx }: { content: Content; ctx: Ctx }) {
  return <p className="pk-careers__empty">{ctx.t(content.note) || ctx.ui("noJobs")}</p>;
}

const List: VariantComponent<Content> = ({ content, ctx }) => (
  <Rail heading={content.heading} subheading={content.subheading} ctx={ctx}>
    {content.jobs.length === 0 ? (
      <Empty content={content} ctx={ctx} />
    ) : (
      <ul className="pk-careers__list">
        {content.jobs.map((job, i) => (
          <li key={i}>
            <Job job={job} ctx={ctx} />
          </li>
        ))}
      </ul>
    )}
    {content.jobs.length > 0 && ctx.t(content.note) && (
      <p className="pk-careers__note pk-muted">{ctx.t(content.note)}</p>
    )}
  </Rail>
);

const Cards: VariantComponent<Content> = ({ content, ctx }) => (
  <Stack heading={content.heading} subheading={content.subheading} ctx={ctx}>
    {content.jobs.length === 0 ? (
      <Empty content={content} ctx={ctx} />
    ) : (
      <ul className="pk-grid pk-careers__cards">
        {content.jobs.map((job, i) => (
          <li key={i} className="pk-card">
            <Job job={job} ctx={ctx} />
          </li>
        ))}
      </ul>
    )}
    {content.jobs.length > 0 && ctx.t(content.note) && (
      <p className="pk-careers__note pk-muted">{ctx.t(content.note)}</p>
    )}
  </Stack>
);

export const careers = defineSection({
  type: "careers",
  name: "Careers",
  category: "business",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Work with us", "اعمل معنا"),
    subheading: L("We are a team of twelve and growing.", "نحن فريق من اثني عشر شخصاً ونكبر."),
    jobs: [
      {
        title: L("Frontend engineer", "مهندس واجهات أمامية"),
        location: L("Alexandria or remote", "الإسكندرية أو عن بُعد"),
        type: L("Full time", "دوام كامل"),
        description: L(
          "Build the booking screens used by 63 clinics. React and TypeScript.",
          "ابنِ شاشات الحجز التي تستخدمها 63 عيادة. React وTypeScript.",
        ),
        href: "mailto:jobs@example.com",
      },
      {
        title: L("Clinic onboarding specialist", "أخصائي تهيئة العيادات"),
        location: L("Cairo", "القاهرة"),
        type: L("Full time", "دوام كامل"),
        description: L(
          "Visit new clinics, train their front desk and stay with them for the first month.",
          "زُر العيادات الجديدة ودرّب موظفي الاستقبال ورافقهم في الشهر الأول.",
        ),
        href: "mailto:jobs@example.com",
      },
    ],
    note: L(
      "Do not see your role? Send your CV to jobs@example.com.",
      "لا ترى الوظيفة المناسبة؟ أرسل سيرتك الذاتية إلى jobs@example.com.",
    ),
  }),
  variants: {
    list: { name: "List", component: List },
    cards: { name: "Cards", component: Cards },
  },
  defaultVariant: "list",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "subheading", label: "Subheading", type: "text" },
    {
      key: "jobs",
      label: "Open roles",
      type: "list",
      fields: [
        { key: "title", label: "Job title", type: "text" },
        { key: "location", label: "Location", type: "text" },
        { key: "type", label: "Type", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "href", label: "Apply link or email", type: "url" },
      ],
    },
    { key: "note", label: "Note under the list", type: "text" },
  ],
});
