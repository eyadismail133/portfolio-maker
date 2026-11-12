import { z } from "zod";
import { defineSection, type SectionProps, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { Icon } from "../icons";
import { L } from "../shared";

const schema = z.object({
  heading: textSchema,
  mission: textSchema,
  vision: textSchema,
  values: z
    .array(
      z.object({ icon: z.string().default("heart"), title: textSchema, description: textSchema }),
    )
    .default([]),
});
type Content = z.output<typeof schema>;

function Values({ content, ctx }: SectionProps<Content>) {
  if (content.values.length === 0) return null;
  return (
    <ul className="pk-grid pk-mv__values">
      {content.values.map((value, i) => (
        <li key={i} className="pk-card">
          <Icon name={value.icon} />
          <h3 className="pk-h3">{ctx.t(value.title)}</h3>
          <p className="pk-muted">{ctx.t(value.description)}</p>
        </li>
      ))}
    </ul>
  );
}

const Cards: VariantComponent<Content> = (props) => {
  const { content, ctx } = props;
  return (
    <div className="pk-stack">
      {ctx.t(content.heading) && (
        <div className="pk-stack__head">
          <h2 className="pk-h2">{ctx.t(content.heading)}</h2>
        </div>
      )}
      <div className="pk-mv__pair">
        {ctx.t(content.mission) && (
          <div>
            <h3 className="pk-h3">{ctx.ui("mission")}</h3>
            <p>{ctx.t(content.mission)}</p>
          </div>
        )}
        {ctx.t(content.vision) && (
          <div>
            <h3 className="pk-h3">{ctx.ui("vision")}</h3>
            <p>{ctx.t(content.vision)}</p>
          </div>
        )}
      </div>
      <Values {...props} />
    </div>
  );
};

const Statement: VariantComponent<Content> = (props) => {
  const { content, ctx } = props;
  return (
    <div className="pk-mv__statement">
      {ctx.t(content.heading) && <h2 className="pk-h3 pk-muted">{ctx.t(content.heading)}</h2>}
      <p className="pk-mv__big">{ctx.t(content.mission)}</p>
      {ctx.t(content.vision) && <p className="pk-sub">{ctx.t(content.vision)}</p>}
      <Values {...props} />
    </div>
  );
};

export const missionValues = defineSection({
  type: "mission-values",
  name: "Mission and values",
  category: "business",
  schema,
  defaults: () => ({
    heading: L("Why we do this", "لماذا نفعل هذا"),
    mission: L(
      "No patient in Egypt should lose a morning waiting for a doctor who was never told they were coming.",
      "لا ينبغي لأي مريض في مصر أن يضيّع صباحاً في انتظار طبيب لم يُبلَّغ بقدومه.",
    ),
    vision: L(
      "By 2030, every private clinic in the country can be booked from a phone.",
      "بحلول 2030، يمكن حجز أي عيادة خاصة في البلاد من الهاتف.",
    ),
    values: [
      {
        icon: "users",
        title: L("Sit at the front desk", "اجلس عند الاستقبال"),
        description: L(
          "Every new hire spends a week in a clinic.",
          "كل موظف جديد يقضي أسبوعاً في عيادة.",
        ),
      },
      {
        icon: "target",
        title: L("Fewer features", "مزايا أقل"),
        description: L(
          "We remove a screen every time we add one.",
          "نحذف شاشة في كل مرة نضيف فيها شاشة.",
        ),
      },
      {
        icon: "shield",
        title: L("Patients own their data", "البيانات ملك المريض"),
        description: L(
          "We never sell or share medical records.",
          "لا نبيع السجلات الطبية ولا نشاركها أبداً.",
        ),
      },
    ],
  }),
  variants: {
    cards: { name: "Mission, vision and value cards", component: Cards },
    statement: { name: "One big statement", component: Statement },
  },
  defaultVariant: "cards",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "mission", label: "Mission", type: "longtext" },
    { key: "vision", label: "Vision", type: "longtext" },
    {
      key: "values",
      label: "Values",
      type: "list",
      fields: [
        { key: "icon", label: "Icon", type: "icon" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "longtext" },
      ],
    },
  ],
});
