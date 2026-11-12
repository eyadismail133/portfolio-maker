import { z } from "zod";
import { defineSection, type SectionProps, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L } from "../shared";

const side = z.object({
  title: textSchema,
  body: textSchema,
  points: z.array(textSchema).default([]),
});
const schema = z.object({
  heading: textSchema,
  problem: side.default({ title: "", body: "", points: [] }),
  solution: side.default({ title: "", body: "", points: [] }),
});
type Content = z.output<typeof schema>;

function Side({
  part,
  kind,
  ctx,
}: {
  part: Content["problem"];
  kind: "problem" | "solution";
  ctx: SectionProps<Content>["ctx"];
}) {
  const points = part.points.map((p) => ctx.t(p)).filter(Boolean);
  return (
    <div className={`pk-ps__side pk-ps__side--${kind} ${kind === "solution" ? "pk-card" : ""}`}>
      <h3 className="pk-h3">{ctx.t(part.title)}</h3>
      {ctx.t(part.body) && <p>{ctx.rich(part.body)}</p>}
      {points.length > 0 && (
        <ul className={kind === "solution" ? "pk-points" : "pk-ps__pains"}>
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const make = (layout: "columns" | "story"): VariantComponent<Content> =>
  function ProblemSolution({ content, ctx }) {
    return (
      <div className="pk-stack">
        {ctx.t(content.heading) && (
          <div className="pk-stack__head">
            <h2 className="pk-h2">{ctx.t(content.heading)}</h2>
          </div>
        )}
        <div className={`pk-ps__grid pk-ps__grid--${layout}`}>
          <Side part={content.problem} kind="problem" ctx={ctx} />
          <Side part={content.solution} kind="solution" ctx={ctx} />
        </div>
      </div>
    );
  };

export const problemSolution = defineSection({
  type: "problem-solution",
  name: "Problem and solution",
  category: "business",
  schema,
  defaults: () => ({
    heading: L("One in five appointments never happens", "موعد من كل خمسة لا يتم"),
    problem: {
      title: L("The problem", "المشكلة"),
      body: L(
        "Private clinics in Egypt still run on phone calls and paper diaries.",
        "ما زالت العيادات الخاصة في مصر تعمل بالمكالمات الهاتفية والدفاتر الورقية.",
      ),
      points: [
        L("22% of booked patients do not show up", "22% من المرضى الحاجزين لا يحضرون"),
        L(
          "Receptionists spend 3 hours a day on the phone",
          "يقضي موظفو الاستقبال 3 ساعات يومياً على الهاتف",
        ),
        L(
          "Owners see revenue once a month, on paper",
          "يرى أصحاب العيادات الإيرادات مرة شهرياً وعلى الورق",
        ),
      ],
    },
    solution: {
      title: L("Our answer", "الحل"),
      body: L(
        "Marsa gives each clinic a booking page, automatic reminders and one live calendar.",
        "تمنح مرسى كل عيادة صفحة حجز وتذكيرات تلقائية وتقويماً حياً واحداً.",
      ),
      points: [
        L(
          "No-shows drop below 8% within four months",
          "ينخفض عدم الحضور إلى أقل من 8% خلال أربعة أشهر",
        ),
        L("Patients book themselves, day or night", "يحجز المرضى بأنفسهم في أي وقت"),
        L(
          "Revenue and visits on the owner's phone every morning",
          "الإيرادات والزيارات على هاتف صاحب العيادة كل صباح",
        ),
      ],
    },
  }),
  variants: {
    columns: { name: "Two columns", component: make("columns") },
    story: { name: "One after the other", component: make("story") },
  },
  defaultVariant: "columns",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "problem.title", label: "Problem title", type: "text" },
    { key: "problem.body", label: "Problem", type: "longtext" },
    { key: "problem.points", label: "Problem points", type: "text-list" },
    { key: "solution.title", label: "Solution title", type: "text" },
    { key: "solution.body", label: "Solution", type: "longtext" },
    { key: "solution.points", label: "Solution points", type: "text-list" },
  ],
});
