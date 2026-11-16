import { z } from "zod";
import { defineSection, type SectionContext, type VariantComponent } from "../../registry";
import { assetRefSchema, linkSchema, textSchema } from "../../schema/primitives";
import { ButtonLink, L, Media, Paragraphs } from "../shared";

/**
 * Pro showcase: your product in a laptop and a phone drawn in CSS. The phone floats gently
 * (CSS only, off with reduced motion or the page's animation set to none).
 */
const schema = z.object({
  heading: textSchema,
  body: textSchema,
  /** Screenshot for the laptop (wide). */
  screen: assetRefSchema.optional(),
  /** Screenshot for the phone (tall). */
  phone: assetRefSchema.optional(),
  button: linkSchema.optional(),
});
type Content = z.output<typeof schema>;

function Copy({ content, ctx }: { content: Content; ctx: SectionContext }) {
  return (
    <div className="pk-dev__copy">
      {ctx.t(content.heading) && <h2 {...ctx.el("heading", "pk-h2")}>{ctx.t(content.heading)}</h2>}
      <Paragraphs ctx={ctx} elKey="body" text={ctx.t(content.body)} />
      <ButtonLink link={content.button} ctx={ctx} elKey="button" />
    </div>
  );
}

function Laptop({ content, ctx }: { content: Content; ctx: SectionContext }) {
  return (
    <div className="pk-dev__laptop">
      <div className="pk-dev__screen">
        <Media
          ctx={ctx}
          elKey="screen"
          asset={content.screen}
          label={ctx.t(content.heading)}
          className="pk-dev__shot"
        />
      </div>
      <div className="pk-dev__base" aria-hidden="true" />
    </div>
  );
}

function Phone({ content, ctx }: { content: Content; ctx: SectionContext }) {
  return (
    <div className="pk-dev__phone">
      <Media
        ctx={ctx}
        elKey="phone"
        asset={content.phone}
        label={ctx.t(content.heading)}
        className="pk-dev__shot"
      />
    </div>
  );
}

const LaptopLayout: VariantComponent<Content> = (props) => (
  <div className="pk-dev pk-dev--laptop">
    <Copy {...props} />
    <Laptop {...props} />
  </div>
);

const Duo: VariantComponent<Content> = (props) => (
  <div className="pk-dev pk-dev--duo">
    <Copy {...props} />
    <div className="pk-dev__pair">
      <Laptop {...props} />
      <Phone {...props} />
    </div>
  </div>
);

const PhoneLayout: VariantComponent<Content> = (props) => (
  <div className="pk-dev pk-dev--phone">
    <Phone {...props} />
    <Copy {...props} />
  </div>
);

/** What a live page shows once its owner is no longer Pro: the screenshot beside the text. */
const Plain: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-it pk-it--start">
    <Media
      ctx={ctx}
      elKey={content.screen ? "screen" : "phone"}
      asset={content.screen ?? content.phone}
      label={ctx.t(content.heading)}
      className="pk-it__image"
    />
    <div className="pk-it__copy">
      {ctx.t(content.heading) && <h2 {...ctx.el("heading", "pk-h2")}>{ctx.t(content.heading)}</h2>}
      <Paragraphs ctx={ctx} elKey="body" text={ctx.t(content.body)} />
      <ButtonLink link={content.button} ctx={ctx} elKey="button" kind="ghost" />
    </div>
  </div>
);

export const showcaseDevices = defineSection({
  type: "showcase-devices",
  name: "Device mockups",
  category: "showcase",
  pro: true,
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("See it on every screen", "شاهده على كل شاشة"),
    body: L(
      "The same booking page on the front desk computer and on every patient's phone. Add two screenshots and they appear in the frames.",
      "صفحة الحجز نفسها على كمبيوتر الاستقبال وعلى هاتف كل مريض. أضف لقطتي شاشة وستظهران داخل الإطارين.",
    ),
    button: { label: L("Try the live demo", "جرّب العرض الحي"), href: "#" },
  }),
  variants: {
    laptop: { name: "Laptop", component: LaptopLayout },
    duo: { name: "Laptop and phone", component: Duo },
    phone: { name: "Phone", component: PhoneLayout },
  },
  defaultVariant: "duo",
  fallback: Plain,
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Text", type: "longtext" },
    { key: "screen", label: "Laptop screenshot (wide)", type: "image" },
    { key: "phone", label: "Phone screenshot (tall)", type: "image" },
    { key: "button", label: "Button", type: "link" },
  ],
});
