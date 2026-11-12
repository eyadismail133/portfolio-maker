import { z } from "zod";
import { bookingEmbedUrl } from "../../i18n";
import { defineSection, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps, Paragraphs, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  body: textSchema,
  /** A Calendly link is shown in the page; any other https link becomes a button. */
  url: z.string().default(""),
  buttonLabel: textSchema,
});
type Content = z.output<typeof schema>;

const isWebLink = (url: string) => /^https:\/\//i.test(url.trim());

const Embed: VariantComponent<Content> = ({ content, ctx }) => {
  const embed = bookingEmbedUrl(content.url);
  return (
    <Stack heading={content.heading} ctx={ctx}>
      {ctx.t(content.body) && (
        <Paragraphs text={ctx.t(content.body)} className="pk-prose pk-booking__body" />
      )}
      {embed ? (
        <iframe
          className="pk-booking__frame"
          src={embed}
          title={ctx.t(content.heading) || ctx.ui("bookingTitle")}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : isWebLink(content.url) ? (
        <ButtonOnly content={content} ctx={ctx} />
      ) : (
        <div className="pk-booking__empty">{ctx.ui("addBooking")}</div>
      )}
    </Stack>
  );
};

function ButtonOnly({ content, ctx }: Parameters<VariantComponent<Content>>[0]) {
  if (!isWebLink(content.url)) return null;
  return (
    <a className="pk-btn pk-btn--primary" {...linkProps(content.url)}>
      {ctx.t(content.buttonLabel) || ctx.ui("book")}
    </a>
  );
}

const Button: VariantComponent<Content> = ({ content, ctx }) => (
  <div className="pk-booking__box pk-card">
    <div>
      {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
      {ctx.t(content.body) && (
        <Paragraphs text={ctx.t(content.body)} className="pk-prose pk-muted" />
      )}
    </div>
    {isWebLink(content.url) ? (
      <ButtonOnly content={content} ctx={ctx} />
    ) : (
      <p className="pk-booking__empty">{ctx.ui("addBooking")}</p>
    )}
  </div>
);

export const booking = defineSection({
  type: "booking",
  name: "Book a call",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("Book a free 20-minute call", "احجز مكالمة مجانية لمدة 20 دقيقة"),
    body: L(
      "Pick a time that suits you. We will talk about what you need and whether I am the right fit.",
      "اختر الوقت المناسب لك. سنتحدث عمّا تحتاجه وإن كنت الشخص المناسب.",
    ),
    url: "",
    buttonLabel: L("Book a time", "احجز موعداً"),
  }),
  variants: {
    embed: { name: "Calendar in the page", component: Embed },
    button: { name: "Button", component: Button },
  },
  defaultVariant: "embed",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Text", type: "longtext" },
    { key: "url", label: "Calendly or booking link", type: "url" },
    { key: "buttonLabel", label: "Button label", type: "text" },
  ],
});
