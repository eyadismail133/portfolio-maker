import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { linkSchema, textSchema } from "../../schema/primitives";
import { L, linkProps, Rail, Stack } from "../shared";

const schema = z.object({
  heading: textSchema,
  body: textSchema,
  email: z.string().default(""),
  phone: z.string().default(""),
  location: textSchema,
  socials: z.array(linkSchema).default([]),
});
type Content = z.output<typeof schema>;
type Props = Parameters<VariantComponent<Content>>[0];

function details({ content, ctx }: Props) {
  return [
    content.email && {
      label: ctx.ui("email"),
      value: content.email,
      href: `mailto:${content.email}`,
    },
    content.phone && {
      label: ctx.ui("phone"),
      value: content.phone,
      href: `tel:${content.phone.replace(/[^\d+]/g, "")}`,
    },
    ctx.t(content.location) && {
      label: ctx.ui("location"),
      value: ctx.t(content.location),
      href: "",
    },
  ].filter((d): d is { label: string; value: string; href: string } => Boolean(d));
}

/** Emails and phone numbers always read left to right, also on Arabic pages. */
function Value({ d }: { d: { value: string; href: string } }) {
  if (!d.href) return <span>{d.value}</span>;
  return (
    <a href={d.href}>
      <bdi dir="ltr">{d.value}</bdi>
    </a>
  );
}

function Socials({ content, ctx }: Props) {
  const links = content.socials.filter((s) => ctx.t(s.label));
  if (links.length === 0) return null;
  return (
    <ul className="pk-socials">
      {links.map((s, i) => (
        <li key={i}>
          <a {...linkProps(s.href)}>{ctx.t(s.label)}</a>
        </li>
      ))}
    </ul>
  );
}

const WithForm: VariantComponent<Content> = (props) => {
  const { content, ctx } = props;
  return (
    <Rail heading={content.heading} subheading={content.body} ctx={ctx}>
      <div className="pk-contact__grid">
        <form
          className="pk-form"
          data-pk-contact={ctx.formAction ? "" : undefined}
          action={ctx.formAction ?? (content.email ? `mailto:${content.email}` : undefined)}
          method="post"
          encType={ctx.formAction ? undefined : "text/plain"}
        >
          {ctx.formAction && (
            // Left empty by people; filled in by spam robots, whose messages are then dropped.
            <label className="pk-visually-hidden" aria-hidden="true">
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          )}
          <label>
            <span>{ctx.ui("name")}</span>
            <input type="text" name="name" autoComplete="name" maxLength={120} required />
          </label>
          <label>
            <span>{ctx.ui("email")}</span>
            <input type="email" name="email" autoComplete="email" maxLength={200} required />
          </label>
          <label>
            <span>{ctx.ui("message")}</span>
            <textarea name="message" rows={5} maxLength={5000} required />
          </label>
          <button type="submit" className="pk-btn pk-btn--primary">
            {ctx.ui("send")}
          </button>
          <p
            className="pk-form__status"
            role="status"
            data-pk-sending={ctx.ui("sending")}
            data-pk-sent={ctx.ui("sent")}
            data-pk-failed={ctx.ui("sendFailed")}
          />
        </form>
        <div className="pk-contact__info">
          <dl className="pk-facts pk-facts--stacked">
            {details(props).map((d, i) => (
              <div key={i}>
                <dt>{d.label}</dt>
                <dd>
                  <Value d={d} />
                </dd>
              </div>
            ))}
          </dl>
          <Socials {...props} />
        </div>
      </div>
    </Rail>
  );
};

const Cards: VariantComponent<Content> = (props) => {
  const { content, ctx } = props;
  return (
    <Stack heading={content.heading} subheading={content.body} ctx={ctx}>
      <ul className="pk-contact__cards">
        {details(props).map((d, i) => (
          <li key={i} className="pk-card">
            <span className="pk-contact__label">{d.label}</span>
            <Value d={d} />
          </li>
        ))}
      </ul>
      <Socials {...props} />
    </Stack>
  );
};

export const contact = defineSection({
  type: "contact",
  name: "Contact",
  category: "trust",
  schema,
  navLabel: (c) => c.heading,
  defaults: () => ({
    heading: L("Contact", "تواصل معي"),
    body: L(
      "Tell me what you are building and when you need it. I reply within two working days.",
      "أخبرني بما تعمل عليه ومتى تحتاجه. أرد خلال يومي عمل.",
    ),
    email: "hello@example.com",
    phone: "+20 100 000 0000",
    location: L("Cairo, Egypt", "القاهرة، مصر"),
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Behance", href: "https://www.behance.net/" },
      { label: "Dribbble", href: "https://dribbble.com/" },
    ],
  }),
  variants: {
    form: { name: "Form with details", component: WithForm },
    cards: { name: "Detail cards", component: Cards },
  },
  defaultVariant: "form",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Short text", type: "longtext" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "location", label: "Location", type: "text" },
    {
      key: "socials",
      label: "Social links",
      type: "list",
      fields: [
        { key: "label", label: "Name", type: "text" },
        { key: "href", label: "Address", type: "url" },
      ],
    },
  ],
});
