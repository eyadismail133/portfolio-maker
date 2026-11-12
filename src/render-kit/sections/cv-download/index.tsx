import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";
import { linkSchema, textSchema } from "../../schema/primitives";
import { safeHref } from "../../i18n";
import { Icon } from "../icons";
import { L } from "../shared";

const schema = z.object({ heading: textSchema, body: textSchema, file: linkSchema.optional() });
type Content = z.output<typeof schema>;

const make = (layout: "banner" | "inline"): VariantComponent<Content> =>
  function CvDownload({ content, ctx }) {
    const label = ctx.t(content.file?.label);
    return (
      <div className={`pk-cv pk-cv--${layout} ${layout === "banner" ? "pk-card" : ""}`}>
        <div>
          <h2 className={layout === "banner" ? "pk-h2" : "pk-h3"}>{ctx.t(content.heading)}</h2>
          {ctx.t(content.body) && <p className="pk-sub">{ctx.t(content.body)}</p>}
        </div>
        {label && content.file && (
          <a
            className="pk-btn pk-btn--primary pk-cv__btn"
            href={safeHref(content.file.href)}
            download
          >
            <Icon name="download" boxed={false} />
            {label}
          </a>
        )}
      </div>
    );
  };

export const cvDownload = defineSection({
  type: "cv-download",
  name: "CV download",
  category: "profile",
  schema,
  defaults: () => ({
    heading: L("Prefer a one-page version?", "تفضّل نسخة من صفحة واحدة؟"),
    body: L(
      "My CV as a PDF, updated in January 2026.",
      "سيرتي الذاتية بصيغة PDF، محدّثة في يناير 2026.",
    ),
    file: { label: L("Download CV", "تحميل السيرة الذاتية"), href: "#" },
  }),
  variants: {
    banner: { name: "Banner", component: make("banner") },
    inline: { name: "Single line", component: make("inline") },
  },
  defaultVariant: "banner",
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Short text", type: "text" },
    { key: "file", label: "Button and file link", type: "link" },
  ],
});
