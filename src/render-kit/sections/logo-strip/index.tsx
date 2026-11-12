import { z } from "zod";
import { defineSection, type SectionProps, type VariantComponent } from "../../registry";
import { assetRefSchema, textSchema } from "../../schema/primitives";
import { safeImageUrl } from "../../i18n";
import { L } from "../shared";

const schema = z.object({
  heading: textSchema,
  items: z.array(z.object({ name: textSchema, logo: assetRefSchema.optional() })).default([]),
});
type Content = z.output<typeof schema>;

function Logos({ content, ctx, hidden }: SectionProps<Content> & { hidden?: boolean }) {
  return (
    <ul className="pk-logos" aria-hidden={hidden || undefined}>
      {content.items.map((item, i) => {
        const url = safeImageUrl(item.logo?.url);
        return (
          <li key={i}>
            {url && item.logo ? (
              <img
                src={url}
                alt={ctx.t(item.name)}
                width={item.logo.width}
                height={item.logo.height}
                loading="lazy"
              />
            ) : (
              <span>{ctx.t(item.name)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const Row: VariantComponent<Content> = (props) => (
  <div className="pk-logo-strip__row">
    {props.ctx.t(props.content.heading) && (
      <p className="pk-logo-strip__label">{props.ctx.t(props.content.heading)}</p>
    )}
    <Logos {...props} />
  </div>
);

const Scroll: VariantComponent<Content> = (props) => (
  <div className="pk-logo-strip__scroll">
    {props.ctx.t(props.content.heading) && (
      <p className="pk-logo-strip__label">{props.ctx.t(props.content.heading)}</p>
    )}
    <div className="pk-logo-strip__track">
      <Logos {...props} />
      <Logos {...props} hidden />
    </div>
  </div>
);

export const logoStrip = defineSection({
  type: "logo-strip",
  name: "Logo strip",
  category: "start",
  schema,
  defaults: () => ({
    heading: L("Clinics and hospitals that run on our software", "عيادات ومستشفيات تعمل ببرامجنا"),
    items: [
      { name: L("Shifa Clinics", "عيادات شفاء") },
      { name: L("Dar El Teb", "دار الطب") },
      { name: L("Andalus Dental", "أندلس لطب الأسنان") },
      { name: L("Noor Eye Center", "مركز نور للعيون") },
      { name: L("Alex Kids Hospital", "مستشفى أطفال الإسكندرية") },
    ],
  }),
  variants: {
    row: { name: "Row", component: Row },
    scroll: { name: "Moving strip", component: Scroll },
  },
  defaultVariant: "row",
  fields: [
    { key: "heading", label: "Label", type: "text" },
    {
      key: "items",
      label: "Logos",
      type: "list",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "logo", label: "Logo", type: "image" },
      ],
    },
  ],
});
