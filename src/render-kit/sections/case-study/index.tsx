import { z } from "zod";
import { defineSection, type SectionProps, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { L, Media, Paragraphs } from "../shared";

const schema = z.object({
  heading: textSchema,
  summary: textSchema,
  client: textSchema,
  year: z.string().default(""),
  role: textSchema,
  challenge: textSchema,
  solution: textSchema,
  result: textSchema,
  image: assetRefSchema.optional(),
  stats: z.array(z.object({ value: textSchema, label: textSchema })).default([]),
});
type Content = z.output<typeof schema>;

function Head({ content, ctx }: SectionProps<Content>) {
  const meta = [
    [ctx.ui("client"), ctx.t(content.client)],
    [ctx.ui("year"), content.year],
    [ctx.ui("role"), ctx.t(content.role)],
  ].filter(([, value]) => value);
  return (
    <header className="pk-case__head">
      <h2 className="pk-h2">{ctx.t(content.heading)}</h2>
      {ctx.t(content.summary) && <p className="pk-case__summary">{ctx.rich(content.summary)}</p>}
      {meta.length > 0 && (
        <dl className="pk-facts">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

function Parts({ content, ctx }: SectionProps<Content>) {
  const parts = [
    [ctx.ui("challenge"), ctx.t(content.challenge)],
    [ctx.ui("solution"), ctx.t(content.solution)],
    [ctx.ui("result"), ctx.t(content.result)],
  ].filter(([, text]) => text);
  return (
    <div className="pk-case__parts">
      {parts.map(([title, text]) => (
        <div key={title}>
          <h3 className="pk-h3">{title}</h3>
          <Paragraphs text={text} />
        </div>
      ))}
    </div>
  );
}

function Stats({ content, ctx }: SectionProps<Content>) {
  if (content.stats.length === 0) return null;
  return (
    <dl className="pk-case__stats">
      {content.stats.map((stat, i) => (
        <div key={i}>
          <dd>{ctx.t(stat.value)}</dd>
          <dt>{ctx.t(stat.label)}</dt>
        </div>
      ))}
    </dl>
  );
}

const Story: VariantComponent<Content> = (props) => (
  <article className="pk-case pk-case--story">
    <Head {...props} />
    <Media
      asset={props.content.image}
      label={props.ctx.t(props.content.heading)}
      className="pk-case__image"
    />
    <Stats {...props} />
    <Parts {...props} />
  </article>
);

const Split: VariantComponent<Content> = (props) => (
  <article className="pk-case pk-case--split">
    <div>
      <Head {...props} />
      <Parts {...props} />
    </div>
    <div className="pk-case__side">
      <Media
        asset={props.content.image}
        label={props.ctx.t(props.content.heading)}
        className="pk-case__image"
      />
      <Stats {...props} />
    </div>
  </article>
);

export const caseStudy = defineSection({
  type: "case-study",
  name: "Case study",
  category: "work",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Booking for Shifa Clinics", "نظام الحجز لعيادات شفاء"),
    summary: L(
      "How 14 clinics stopped losing a fifth of their appointments to no-shows.",
      "كيف توقفت 14 عيادة عن خسارة خُمس مواعيدها بسبب عدم حضور المرضى.",
    ),
    client: L("Shifa Clinics", "عيادات شفاء"),
    year: "2025",
    role: L("Design and development", "التصميم والتطوير"),
    challenge: L(
      "Patients booked by phone, and 22% never came. Receptionists kept three paper diaries per doctor.",
      "كان المرضى يحجزون بالهاتف، و22% منهم لا يحضرون. وكان موظفو الاستقبال يحتفظون بثلاثة دفاتر ورقية لكل طبيب.",
    ),
    solution: L(
      "We built online booking with a WhatsApp reminder the day before, and one shared calendar for every clinic.",
      "بنينا نظام حجز عبر الإنترنت مع تذكير على واتساب قبل الموعد بيوم، وتقويماً واحداً مشتركاً لكل العيادات.",
    ),
    result: L(
      "No-shows fell to 7% in four months. The reception team got back about two hours a day.",
      "انخفضت نسبة عدم الحضور إلى 7% خلال أربعة أشهر، واستعاد فريق الاستقبال نحو ساعتين يومياً.",
    ),
    stats: [
      { value: "7%", label: L("no-shows, down from 22%", "عدم حضور بعد أن كانت 22%") },
      { value: "14", label: L("clinics on one calendar", "عيادة على تقويم واحد") },
      {
        value: L("2 hrs", "ساعتان"),
        label: L("saved per receptionist each day", "توفير يومي لكل موظف استقبال"),
      },
    ],
  }),
  variants: {
    story: { name: "Long story", component: Story },
    split: { name: "Side by side", component: Split },
  },
  defaultVariant: "story",
  fields: [
    { key: "heading", label: "Project name", type: "text" },
    { key: "summary", label: "One-line summary", type: "longtext" },
    { key: "client", label: "Client", type: "text" },
    { key: "year", label: "Year", type: "text" },
    { key: "role", label: "Your role", type: "text" },
    { key: "challenge", label: "The challenge", type: "longtext" },
    { key: "solution", label: "What you did", type: "longtext" },
    { key: "result", label: "The result", type: "longtext" },
    { key: "image", label: "Image", type: "image" },
    {
      key: "stats",
      label: "Numbers",
      type: "list",
      fields: [
        { key: "value", label: "Number", type: "text" },
        { key: "label", label: "What it means", type: "text" },
      ],
    },
  ],
});
