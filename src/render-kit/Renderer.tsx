import type { CSSProperties } from "react";
import { dirOf, pickText, menuLabel, uiText } from "./i18n";
import { getSection, type SectionContext } from "./registry";
import { RichInline } from "./rich-text";
import type { PortfolioDoc } from "./schema/document";
import type { Lang } from "./schema/primitives";
import "./sections";
import { themeToCssVars } from "./themes/css-vars";
import { getFamily } from "./themes/families";
import { sectionLook } from "./themes/section-style";
import { googleFontsUrl } from "./themes/fonts";

type Props = {
  /** A document that went through `normalizeDoc`. */
  doc: PortfolioDoc;
  /** Language to show. Defaults to the first language of the document. */
  lang?: Lang;
  /** Set to false when the page loads the fonts itself, as the HTML export does. */
  fontLink?: boolean;
  /** Address of the page in each language, for the language switch in the navigation bar. */
  languageHrefs?: Partial<Record<Lang, string>>;
  /** Where the contact form posts on a published page. */
  formAction?: string;
  /**
   * Set for standalone HTML (exports and published pages). Until the page script runs, controls
   * that only work with it are hidden and their plain fallbacks shown.
   */
  standalone?: boolean;
};

const LANGUAGE_NAMES: Record<Lang, string> = { en: "English", ar: "العربية" };

/** Turns a portfolio document into the page. The same code runs in previews, published pages and exports. */
export function Renderer({
  doc,
  lang,
  fontLink = true,
  languageHrefs,
  formAction,
  standalone,
}: Props) {
  const language = lang && doc.meta.languages.includes(lang) ? lang : doc.meta.languages[0];
  const visible = doc.sections.flatMap((section) => {
    const def = getSection(section.type);
    return def && !section.hidden ? [{ section, def }] : [];
  });

  const ctx: SectionContext = {
    lang: language,
    dir: dirOf(language),
    t: (value) => pickText(value, language),
    rich: (value) => <RichInline text={pickText(value, language)} />,
    ui: (key) => uiText(key, language),
    languages: doc.meta.languages,
    languageLinks: doc.meta.languages.flatMap((other) => {
      const href = languageHrefs?.[other];
      return other !== language && href
        ? [{ lang: other, label: LANGUAGE_NAMES[other], href }]
        : [];
    }),
    formAction,
    nav: visible.flatMap(({ section, def }) => {
      const heading = def.navLabel ? pickText(def.navLabel(section.content), language) : "";
      const label = heading ? menuLabel(section.type, heading, language) : "";
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
      data-pk-shape={doc.theme.imageShape}
      data-pk-buttons={doc.theme.buttons}
      data-pk-deco={doc.theme.headingDeco}
      data-pk-pattern={doc.theme.pattern}
      data-pk-hcase={doc.theme.headingCase}
      data-pk-static={standalone ? "" : undefined}
      style={themeToCssVars(doc.theme, language) as CSSProperties}
    >
      {/* A plain link: the page must still show when the font service is slow or blocked. */}
      {fontLink && <link rel="stylesheet" href={googleFontsUrl(doc.theme, doc.meta.languages)} />}
      {sorted.map(({ section, def }) => {
        const variant = def.variants[section.variant] ?? def.variants[def.defaultVariant];
        const Component = variant.component;
        const Tag =
          def.pinned === "top" ? "header" : def.pinned === "bottom" ? "footer" : "section";
        const look = sectionLook(section.style, doc.theme.palette);
        return (
          <Tag
            key={section.id}
            id={section.id}
            className={`pk-section pk-${def.type} pk-${def.type}--${section.variant}`}
            {...look.attrs}
            style={Object.keys(look.vars).length ? (look.vars as CSSProperties) : undefined}
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
