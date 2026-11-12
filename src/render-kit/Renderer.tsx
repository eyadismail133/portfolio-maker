import type { CSSProperties } from "react";
import { dirOf, pickText, uiText } from "./i18n";
import { getSection, type SectionContext } from "./registry";
import type { PortfolioDoc } from "./schema/document";
import type { Lang } from "./schema/primitives";
import "./sections";
import { themeToCssVars } from "./themes/css-vars";
import { getFamily } from "./themes/families";
import { googleFontsUrl } from "./themes/fonts";

type Props = {
  /** A document that went through `normalizeDoc`. */
  doc: PortfolioDoc;
  /** Language to show. Defaults to the first language of the document. */
  lang?: Lang;
  /** Set to false when the page loads the fonts itself, as the HTML export does. */
  fontLink?: boolean;
};

/** Turns a portfolio document into the page. The same code runs in previews, published pages and exports. */
export function Renderer({ doc, lang, fontLink = true }: Props) {
  const language = lang && doc.meta.languages.includes(lang) ? lang : doc.meta.languages[0];
  const visible = doc.sections.flatMap((section) => {
    const def = getSection(section.type);
    return def && !section.hidden ? [{ section, def }] : [];
  });

  const ctx: SectionContext = {
    lang: language,
    dir: dirOf(language),
    t: (value) => pickText(value, language),
    ui: (key) => uiText(key, language),
    languages: doc.meta.languages,
    nav: visible.flatMap(({ section, def }) => {
      const label = def.navLabel ? pickText(def.navLabel(section.content), language) : "";
      return label ? [{ id: section.id, label }] : [];
    }),
  };

  const order = { top: 0, none: 1, bottom: 2 } as const;
  const sorted = [...visible].sort(
    (a, b) => order[a.def.pinned ?? "none"] - order[b.def.pinned ?? "none"],
  );

  return (
    <div
      className="pk-root"
      lang={language}
      dir={ctx.dir}
      data-pk-family={getFamily(doc.theme.family).id}
      data-pk-mode={doc.theme.mode}
      data-pk-animation={doc.theme.animation}
      style={themeToCssVars(doc.theme, language) as CSSProperties}
    >
      {/* A plain link: the page must still show when the font service is slow or blocked. */}
      {fontLink && (
        <link rel="stylesheet" href={googleFontsUrl(doc.theme.fonts, doc.meta.languages)} />
      )}
      {sorted.map(({ section, def }) => {
        const variant = def.variants[section.variant] ?? def.variants[def.defaultVariant];
        const Component = variant.component;
        const Tag =
          def.pinned === "top" ? "header" : def.pinned === "bottom" ? "footer" : "section";
        return (
          <Tag
            key={section.id}
            id={section.id}
            className={`pk-section pk-${def.type} pk-${def.type}--${section.variant}`}
            data-pk-bg={section.style?.background ?? "default"}
            data-pk-pad={section.style?.padding ?? "normal"}
          >
            <div className="pk-container">
              <Component content={section.content} ctx={ctx} />
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
