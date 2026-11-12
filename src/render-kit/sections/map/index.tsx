import { z } from "zod";
import { mapEmbedUrl } from "../../i18n";
import { defineSection, type SectionProps, type VariantComponent } from "../../registry";
import { textSchema } from "../../schema/primitives";
import { L, linkProps, Paragraphs } from "../shared";

const schema = z.object({
  heading: textSchema,
  address: textSchema,
  hours: textSchema,
  /** Place name or address to show on the map. */
  query: z.string().default(""),
});
type Content = z.output<typeof schema>;

function Frame({ content, ctx }: SectionProps<Content>) {
  if (!content.query.trim()) return null;
  return (
    <iframe
      className="pk-embed pk-map__frame"
      src={mapEmbedUrl(content.query)}
      title={ctx.t(content.heading) || ctx.ui("location")}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

function Details({ content, ctx }: SectionProps<Content>) {
  return (
    <div className="pk-map__details">
      {ctx.t(content.heading) && <h2 className="pk-h2">{ctx.t(content.heading)}</h2>}
      <Paragraphs text={ctx.t(content.address)} />
      <Paragraphs text={ctx.t(content.hours)} className="pk-prose pk-muted" />
      {content.query.trim() && (
        <a
          className="pk-link"
          {...linkProps(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.query)}`,
          )}
        >
          {ctx.ui("openMap")}
        </a>
      )}
    </div>
  );
}

const Full: VariantComponent<Content> = (props) => (
  <div className="pk-map__grid pk-map__grid--full">
    <Details {...props} />
    <Frame {...props} />
  </div>
);

const Card: VariantComponent<Content> = (props) => (
  <div className="pk-map__grid pk-map__grid--card">
    <div className="pk-card">
      <Details {...props} />
    </div>
    <Frame {...props} />
  </div>
);

export const map = defineSection({
  type: "map",
  name: "Map",
  category: "trust",
  schema,
  defaults: () => ({
    heading: L("Visit us", "تفضل بزيارتنا"),
    address: L(
      "14 Fouad Street, 3rd floor\nAlexandria, Egypt",
      "14 شارع فؤاد، الدور الثالث\nالإسكندرية، مصر",
    ),
    hours: L("Sunday to Thursday, 9:00 to 17:00", "من الأحد إلى الخميس، من 9:00 إلى 17:00"),
    query: "Fouad Street, Alexandria, Egypt",
  }),
  variants: {
    full: { name: "Wide map", component: Full },
    card: { name: "Address card beside map", component: Card },
  },
  defaultVariant: "card",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "address", label: "Address", type: "longtext" },
    { key: "hours", label: "Opening hours", type: "longtext" },
    { key: "query", label: "Place to show on the map", type: "text" },
  ],
});
