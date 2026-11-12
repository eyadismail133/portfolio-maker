import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { assetRefSchema, linkSchema, textSchema } from "../../schema/primitives";
import { ButtonLink, L, Media } from "../shared";

const schema = z.object({
  name: textSchema,
  title: textSchema,
  intro: textSchema,
  /** Short status line, for example "Open to new projects from March". */
  status: textSchema,
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
  image: assetRefSchema.optional(),
});
type Content = z.output<typeof schema>;

function Copy({ content, ctx }: Parameters<VariantComponent<Content>>[0]) {
  const status = ctx.t(content.status);
  const title = ctx.t(content.title);
  const intro = ctx.t(content.intro);
  return (
    <div className="pk-hero__copy">
      {title && <p className="pk-hero__title">{title}</p>}
      <h1 className="pk-hero__name">{ctx.t(content.name)}</h1>
      {intro && <p className="pk-hero__intro">{intro}</p>}
      <div className="pk-hero__actions">
        <ButtonLink link={content.primaryCta} ctx={ctx} />
        <ButtonLink link={content.secondaryCta} ctx={ctx} kind="ghost" />
      </div>
      {status && (
        <p className="pk-hero__status">
          <span className="pk-hero__dot" aria-hidden="true" />
          {status}
        </p>
      )}
    </div>
  );
}

const Split: VariantComponent<Content> = (props) => (
  <div className="pk-hero__grid">
    <Copy {...props} />
    <Media
      asset={props.content.image}
      label={props.ctx.t(props.content.name)}
      className="pk-hero__image"
    />
  </div>
);

const Centered: VariantComponent<Content> = (props) => (
  <div className="pk-hero__center">
    <Media
      asset={props.content.image}
      label={props.ctx.t(props.content.name)}
      className="pk-hero__avatar"
    />
    <Copy {...props} />
  </div>
);

export const hero = defineSection({
  type: "hero",
  name: "Hero",
  category: "start",
  schema,
  defaults: () => ({
    name: L("Layla Hassan", "ليلى حسن"),
    title: L("Product designer", "مصممة منتجات رقمية"),
    intro: L(
      "I design banking and payment apps that people can use without reading a manual. Eight years, three fintech teams, based in Cairo.",
      "أصمم تطبيقات بنكية وتطبيقات دفع يستخدمها الناس دون الحاجة إلى دليل. ثماني سنوات من الخبرة مع ثلاثة فرق تقنية مالية، ومقيمة في القاهرة.",
    ),
    status: L("Open to new projects from March", "متاحة لمشاريع جديدة ابتداءً من مارس"),
    primaryCta: { label: L("See my work", "شاهد أعمالي"), href: "#projects" },
    secondaryCta: { label: L("Download CV", "تحميل السيرة الذاتية"), href: "#" },
  }),
  variants: {
    split: { name: "Text beside image", component: Split },
    centered: { name: "Centered", component: Centered },
  },
  defaultVariant: "split",
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "title", label: "Job title or tagline", type: "text" },
    { key: "intro", label: "Short introduction", type: "longtext" },
    { key: "status", label: "Status line", type: "text" },
    { key: "primaryCta", label: "Main button", type: "link" },
    { key: "secondaryCta", label: "Second button", type: "link" },
    { key: "image", label: "Photo", type: "image" },
  ],
});
