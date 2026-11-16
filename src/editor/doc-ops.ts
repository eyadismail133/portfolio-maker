import { getSection, parseContent, type AnySectionDefinition } from "@/render-kit/registry";
import { plainText } from "@/render-kit/rich-text";
import {
  ELEMENT_KEY,
  elementStyleSchema,
  type ElementStyle,
  type PortfolioDoc,
  type Section,
  type SectionStyle,
} from "@/render-kit/schema/document";
import type { Lang, LocalizedText } from "@/render-kit/schema/primitives";

/** Pure functions that change a portfolio document. Each returns a new document. */

export type Path = (string | number)[];

export function getAt(value: unknown, path: Path): unknown {
  return path.reduce<unknown>(
    (current, key) =>
      current != null && typeof current === "object"
        ? (current as Record<string | number, unknown>)[key]
        : undefined,
    value,
  );
}

/** Copy of `value` with the item at `path` replaced. Only the touched branches are copied. */
export function setAt<T>(value: T, path: Path, next: unknown): T {
  if (path.length === 0) return next as T;
  const [key, ...rest] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[key as number] = setAt(copy[key as number], rest, next);
    return copy as T;
  }
  const source = (value ?? {}) as Record<string, unknown>;
  return { ...source, [key]: setAt(source[key as string], rest, next) } as T;
}

function pinnedOf(section: Section) {
  return getSection(section.type)?.pinned;
}

function uniqueId(doc: PortfolioDoc, type: string): string {
  const taken = new Set(doc.sections.map((s) => s.id));
  if (!taken.has(type)) return type;
  let n = 2;
  while (taken.has(`${type}-${n}`)) n += 1;
  return `${type}-${n}`;
}

function replaceSection(
  doc: PortfolioDoc,
  id: string,
  change: (section: Section) => Section,
): PortfolioDoc {
  return { ...doc, sections: doc.sections.map((s) => (s.id === id ? change(s) : s)) };
}

/**
 * Adds a section with its sample content. It goes after `afterId` when given, otherwise at the
 * end of the page. Navbars always go first and footers last.
 */
export function addSection(
  doc: PortfolioDoc,
  type: string,
  variant?: string,
  afterId?: string | null,
): { doc: PortfolioDoc; id: string } | null {
  const def = getSection(type);
  if (!def) return null;
  const content = parseContent(def, def.defaults());
  if (content === null) return null;
  const section: Section = {
    id: uniqueId(doc, type),
    type,
    variant: variant && def.variants[variant] ? variant : def.defaultVariant,
    hidden: false,
    content,
  };
  const sections = [...doc.sections];
  const firstBottom = sections.findIndex((s) => pinnedOf(s) === "bottom");
  const lastTop = sections.reduce((last, s, i) => (pinnedOf(s) === "top" ? i : last), -1);
  const end = firstBottom === -1 ? sections.length : firstBottom;
  let index = end;
  if (def.pinned === "top") index = 0;
  else if (def.pinned === "bottom") index = sections.length;
  else if (afterId) {
    const after = sections.findIndex((s) => s.id === afterId);
    if (after !== -1) index = Math.min(Math.max(after + 1, lastTop + 1), end);
  }
  sections.splice(index, 0, section);
  return { doc: { ...doc, sections }, id: section.id };
}

export function removeSection(doc: PortfolioDoc, id: string): PortfolioDoc {
  return { ...doc, sections: doc.sections.filter((s) => s.id !== id) };
}

export function duplicateSection(
  doc: PortfolioDoc,
  id: string,
): { doc: PortfolioDoc; id: string } | null {
  const index = doc.sections.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const copy = { ...doc.sections[index], id: uniqueId(doc, doc.sections[index].type) };
  const sections = [...doc.sections];
  sections.splice(index + 1, 0, copy);
  return { doc: { ...doc, sections }, id: copy.id };
}

/** True when the section can move one step up (-1) or down (1). Pinned sections never move. */
export function canMove(doc: PortfolioDoc, id: string, delta: -1 | 1): boolean {
  const index = doc.sections.findIndex((s) => s.id === id);
  const target = doc.sections[index + delta];
  return index !== -1 && !!target && !pinnedOf(doc.sections[index]) && !pinnedOf(target);
}

export function moveSection(doc: PortfolioDoc, id: string, delta: -1 | 1): PortfolioDoc {
  if (!canMove(doc, id, delta)) return doc;
  const index = doc.sections.findIndex((s) => s.id === id);
  const sections = [...doc.sections];
  [sections[index], sections[index + delta]] = [sections[index + delta], sections[index]];
  return { ...doc, sections };
}

/** Moves a section to the place of another one, for drag and drop. */
export function moveSectionTo(doc: PortfolioDoc, id: string, targetId: string): PortfolioDoc {
  const from = doc.sections.findIndex((s) => s.id === id);
  const to = doc.sections.findIndex((s) => s.id === targetId);
  if (from === -1 || to === -1 || from === to) return doc;
  if (pinnedOf(doc.sections[from]) || pinnedOf(doc.sections[to])) return doc;
  const sections = [...doc.sections];
  const [moved] = sections.splice(from, 1);
  sections.splice(to, 0, moved);
  return { ...doc, sections };
}

export function toggleHidden(doc: PortfolioDoc, id: string): PortfolioDoc {
  return replaceSection(doc, id, (s) => ({ ...s, hidden: !s.hidden }));
}

export function setVariant(doc: PortfolioDoc, id: string, variant: string): PortfolioDoc {
  return replaceSection(doc, id, (s) =>
    getSection(s.type)?.variants[variant] ? { ...s, variant } : s,
  );
}

/** Changes part of a section's style. A value of undefined removes that choice. */
export function setSectionStyle(
  doc: PortfolioDoc,
  id: string,
  style: Partial<SectionStyle>,
): PortfolioDoc {
  return replaceSection(doc, id, (s) => {
    const next: Record<string, unknown> = { background: "default", padding: "normal", ...s.style };
    for (const [key, value] of Object.entries(style)) {
      if (value === undefined) delete next[key];
      else next[key] = value;
    }
    return { ...s, style: next as SectionStyle };
  });
}

function withoutStyle(section: Section): Section {
  const copy = { ...section };
  delete copy.style;
  return copy;
}

/** Back to the look the design family gives the section. */
export function resetSectionStyle(doc: PortfolioDoc, id: string): PortfolioDoc {
  return replaceSection(doc, id, withoutStyle);
}

/**
 * Gives every other section the same style as this one. The navigation bar and footer keep
 * theirs: their look belongs to the frame of the page, not to its content.
 */
export function applyStyleToAll(doc: PortfolioDoc, id: string): PortfolioDoc {
  const source = doc.sections.find((s) => s.id === id);
  if (!source) return doc;
  return {
    ...doc,
    sections: doc.sections.map((s) =>
      s.id === id || getSection(s.type)?.pinned
        ? s
        : source.style
          ? { ...s, style: { ...source.style } }
          : withoutStyle(s),
    ),
  };
}

/**
 * Replaces the content of a section. The content is checked against the section's schema, which
 * also fills in anything missing. Returns null when the content is not valid, so a bad edit can
 * never reach the page.
 */
export function setContent(doc: PortfolioDoc, id: string, content: unknown): PortfolioDoc | null {
  const section = doc.sections.find((s) => s.id === id);
  const def = section && getSection(section.type);
  if (!def) return null;
  const parsed = parseContent(def, content);
  if (parsed === null) return null;
  return replaceSection(doc, id, (s) => ({ ...s, content: parsed }));
}

/** The text of one language exactly as stored, without falling back to the other language. */
export function readLocalized(value: LocalizedText | undefined, lang: Lang): string {
  if (value == null) return "";
  return typeof value === "string" ? value : (value[lang] ?? "");
}

/** The text of the other language, shown as a hint while a translation is missing. */
export function otherLanguageText(value: LocalizedText | undefined, lang: Lang): string {
  if (value == null || typeof value === "string") return "";
  return (lang === "en" ? value.ar : value.en) ?? "";
}

/**
 * Writes text for one language. A portfolio with one language stores plain strings; with two
 * languages each one keeps its own text.
 */
export function writeLocalized(
  value: LocalizedText | undefined,
  lang: Lang,
  text: string,
  languages: readonly Lang[],
): LocalizedText {
  if (languages.length < 2) return text;
  const current =
    typeof value === "string"
      ? Object.fromEntries(languages.map((l) => [l, value]))
      : (value ?? {});
  return { ...current, [lang]: text };
}

/** Changes the languages of a portfolio. The first one is the default. */
export function setLanguages(doc: PortfolioDoc, languages: Lang[]): PortfolioDoc {
  const unique = [...new Set(languages)];
  if (unique.length === 0) return doc;
  return { ...doc, meta: { ...doc.meta, languages: unique } };
}

const localizedCache = new Map<string, boolean>();

/** Finds out from the section's schema whether a text keeps one value per language. */
export function isLocalizedIn(def: AnySectionDefinition, content: unknown, path: Path): boolean {
  const key = `${def.type}:${path.map((p) => (typeof p === "number" ? "*" : p)).join(".")}`;
  const known = localizedCache.get(key);
  if (known !== undefined) return known;
  const result = def.schema.safeParse(setAt(content, path, { en: "x", ar: "x" })).success;
  localizedCache.set(key, result);
  return result;
}

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * Finds the text in a section's content that shows on the page as `shown`, for editing it in
 * place. Texts with bold, italic or link marks are skipped: those are edited in the form, so the
 * marks are not lost.
 */
export function findTextPath(content: unknown, lang: Lang, shown: string): Path | null {
  const wanted = normalize(shown);
  if (!wanted) return null;
  const walk = (value: unknown, path: Path): Path | null => {
    if (typeof value === "string") {
      return normalize(value) === wanted ? path : null;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const found = walk(value[i], [...path, i]);
        if (found) return found;
      }
      return null;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record);
      // A text with one value per language.
      if (keys.length > 0 && keys.every((k) => k === "en" || k === "ar")) {
        const raw =
          readLocalized(record as LocalizedText, lang) || (lang === "en" ? record.ar : record.en);
        return typeof raw === "string" && normalize(raw) === wanted ? path : null;
      }
      for (const key of keys) {
        if (key === "id" || key === "url" || key === "href" || key === "assetId") continue;
        const found = walk(record[key], [...path, key]);
        if (found) return found;
      }
    }
    return null;
  };
  const path = walk(content, []);
  if (!path) return null;
  const raw = getAt(content, path);
  const text = typeof raw === "string" ? raw : readLocalized(raw as LocalizedText, lang);
  return plainText(text) === text ? path : null;
}

/** Writes text typed in the preview back into the section, in the language being edited. */
export function setTextAt(
  doc: PortfolioDoc,
  id: string,
  path: Path,
  text: string,
  lang: Lang,
): PortfolioDoc | null {
  const section = doc.sections.find((s) => s.id === id);
  const def = section && getSection(section.type);
  if (!section || !def) return null;
  const current = getAt(section.content, path);
  const next = isLocalizedIn(def, section.content, path)
    ? writeLocalized(current as LocalizedText, lang, text, doc.meta.languages)
    : text;
  return setContent(doc, id, setAt(section.content, path, next));
}

/**
 * Changes the style of one element of a section. Values set to undefined go back to the design's
 * own look; `null` resets the element completely. An element left with no choices is removed.
 */
export function setElementStyle(
  doc: PortfolioDoc,
  id: string,
  key: string,
  style: Partial<ElementStyle> | null,
): PortfolioDoc | null {
  if (!ELEMENT_KEY.test(key)) return null;
  const section = doc.sections.find((s) => s.id === id);
  if (!section) return null;
  const merged: Record<string, unknown> = style ? { ...section.elements?.[key], ...style } : {};
  for (const name of Object.keys(merged)) if (merged[name] === undefined) delete merged[name];
  const parsed = elementStyleSchema.safeParse(merged);
  if (!parsed.success) return null;
  const elements = { ...section.elements };
  if (Object.keys(parsed.data).length > 0) elements[key] = parsed.data;
  else delete elements[key];
  return replaceSection(doc, id, (s) => {
    const next: Section = { ...s, elements };
    if (Object.keys(elements).length === 0) delete next.elements;
    return next;
  });
}

/** Path to the list item with this id inside section content, or null. */
export function itemPath(content: unknown, itemId: string): Path | null {
  const walk = (value: unknown, path: Path): Path | null => {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const item = value[i];
        if (item && typeof item === "object" && (item as { id?: unknown }).id === itemId) {
          return [...path, i];
        }
        const found = walk(item, [...path, i]);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        const found = walk(child, [...path, key]);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(content, []);
}

/**
 * Content path of an element key: "heading" is ["heading"], "i3" is the path of item i3 (for
 * example ["items", 2]) and "i3.image" goes on inside that item.
 */
export function elementPath(content: unknown, key: string): Path {
  const [first, ...rest] = key.split(".");
  const item = /^i\d+$/.test(first) ? itemPath(content, first) : null;
  const tail = rest.map((part) => (/^\d+$/.test(part) ? Number(part) : part));
  return item ? [...item, ...tail] : [first, ...tail];
}

/** The element key for a content path: the reverse of `elementPath`. */
export function elementKeyFor(content: unknown, path: Path): string {
  // The deepest list item on the path gives the start of the key.
  for (let end = path.length; end > 0; end -= 1) {
    const value = getAt(content, path.slice(0, end));
    const id = value && typeof value === "object" ? (value as { id?: unknown }).id : undefined;
    if (typeof id === "string" && typeof path[end - 1] === "number") {
      return [id, ...path.slice(end)].join(".");
    }
  }
  return path.join(".");
}

/** Path of the image with this address inside section content, or null. */
export function assetPath(content: unknown, url: string): Path | null {
  const walk = (value: unknown, path: Path): Path | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (typeof record.assetId === "string" && record.url === url) return path;
    for (const [key, child] of Object.entries(record)) {
      const found = walk(child, [...path, Array.isArray(value) ? Number(key) : key]);
      if (found) return found;
    }
    return null;
  };
  return walk(content, []);
}

/** The list holding an item and the item's place in it, or null. */
function itemPlace(content: unknown, itemId: string): { list: Path; index: number } | null {
  const path = itemPath(content, itemId);
  if (!path) return null;
  return { list: path.slice(0, -1), index: path[path.length - 1] as number };
}

function moveInList(
  doc: PortfolioDoc,
  id: string,
  list: Path,
  from: number,
  to: number,
): PortfolioDoc | null {
  const section = doc.sections.find((s) => s.id === id);
  if (!section || from === to) return null;
  const items = getAt(section.content, list);
  if (!Array.isArray(items) || to < 0 || to >= items.length) return null;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return setContent(doc, id, setAt(section.content, list, next));
}

/**
 * Moves a list item to the place of another item of the same list (dragging in the preview).
 * Items of different lists never swap.
 */
export function moveItemTo(
  doc: PortfolioDoc,
  id: string,
  itemId: string,
  targetId: string,
): PortfolioDoc | null {
  const content = doc.sections.find((s) => s.id === id)?.content;
  const from = itemPlace(content, itemId);
  const to = itemPlace(content, targetId);
  if (!from || !to || from.list.join(".") !== to.list.join(".")) return null;
  return moveInList(doc, id, from.list, from.index, to.index);
}

/** Moves a list item one place earlier (-1) or later (1). */
export function moveItemBy(
  doc: PortfolioDoc,
  id: string,
  itemId: string,
  delta: -1 | 1,
): PortfolioDoc | null {
  const content = doc.sections.find((s) => s.id === id)?.content;
  const place = itemPlace(content, itemId);
  if (!place) return null;
  return moveInList(doc, id, place.list, place.index, place.index + delta);
}

/** True when the element key is a whole list item, so it can be moved. */
export function isItemKey(key: string | null | undefined): key is string {
  return !!key && /^i\d+$/.test(key);
}
