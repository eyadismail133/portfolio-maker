import { create } from "zustand";
import { getSection } from "@/render-kit/registry";
import type { PortfolioDoc, Section, Theme } from "@/render-kit/schema/document";
import type { AssetRef, Lang } from "@/render-kit/schema/primitives";
import { applyFamily } from "@/render-kit/themes/apply";
import * as ops from "./doc-ops";

const HISTORY_LIMIT = 100;
/** Edits to the same field within this time count as one undo step. */
const GROUP_MS = 1500;

export type Device = "desktop" | "tablet" | "phone";

type EditorState = {
  doc: PortfolioDoc | null;
  past: PortfolioDoc[];
  future: PortfolioDoc[];
  lastGroup: string | null;
  lastGroupAt: number;
  selectedId: string | null;
  /** Language being edited and previewed. */
  lang: Lang;
  device: Device;
  /** Goes up on every change, so the saver knows there is something new. */
  revision: number;
  /** Stores an image and returns its reference. Missing while editing without an account. */
  uploader: ((file: File) => Promise<AssetRef>) | null;
  /** Plan of the signed-in account; null while editing without an account. */
  plan: "free" | "pro" | null;

  load: (doc: PortfolioDoc) => void;
  /** Makes `next` the current document and records an undo step. */
  commit: (next: PortfolioDoc | null, group?: string) => void;
  undo: () => void;
  redo: () => void;
  select: (id: string | null) => void;
  setLang: (lang: Lang) => void;
  setDevice: (device: Device) => void;

  updateContent: (id: string, content: unknown, group?: string) => void;
  /** Text typed directly in the preview. */
  setTextAt: (id: string, path: (string | number)[], text: string) => void;
  addSection: (type: string, variant?: string) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  moveSection: (id: string, delta: -1 | 1) => void;
  moveSectionTo: (id: string, targetId: string) => void;
  toggleHidden: (id: string) => void;
  setVariant: (id: string, variant: string) => void;
  setSectionStyle: (id: string, style: Partial<NonNullable<Section["style"]>>) => void;
  setTheme: (theme: Partial<Theme>, group?: string) => void;
  setFamily: (family: string, keepColors?: boolean) => void;
  setMeta: (meta: Partial<PortfolioDoc["meta"]>, group?: string) => void;
  setLanguages: (languages: Lang[]) => void;
};

export const useEditor = create<EditorState>((set, get) => {
  /** Runs a change on the current document, if there is one. */
  const change = (fn: (doc: PortfolioDoc) => PortfolioDoc | null, group?: string) => {
    const { doc, commit } = get();
    if (doc) commit(fn(doc), group);
  };

  return {
    doc: null,
    past: [],
    future: [],
    lastGroup: null,
    lastGroupAt: 0,
    selectedId: null,
    lang: "en",
    device: "desktop",
    revision: 0,
    uploader: null,
    plan: null,

    load: (doc) =>
      set({
        doc,
        past: [],
        future: [],
        lastGroup: null,
        selectedId: null,
        lang: doc.meta.languages[0],
        revision: 0,
      }),

    commit: (next, group) => {
      const state = get();
      if (!next || !state.doc || next === state.doc) return;
      const now = Date.now();
      const sameGroup = !!group && group === state.lastGroup && now - state.lastGroupAt < GROUP_MS;
      set({
        doc: next,
        past: sameGroup ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        lastGroup: group ?? null,
        lastGroupAt: now,
        revision: state.revision + 1,
        lang: next.meta.languages.includes(state.lang) ? state.lang : next.meta.languages[0],
        selectedId: next.sections.some((s) => s.id === state.selectedId) ? state.selectedId : null,
      });
    },

    undo: () => {
      const { doc, past, future, revision, selectedId } = get();
      const previous = past[past.length - 1];
      if (!doc || !previous) return;
      set({
        doc: previous,
        past: past.slice(0, -1),
        future: [doc, ...future],
        lastGroup: null,
        revision: revision + 1,
        selectedId: previous.sections.some((s) => s.id === selectedId) ? selectedId : null,
      });
    },

    redo: () => {
      const { doc, past, future, revision } = get();
      const next = future[0];
      if (!doc || !next) return;
      set({
        doc: next,
        past: [...past, doc],
        future: future.slice(1),
        lastGroup: null,
        revision: revision + 1,
      });
    },

    select: (id) => set({ selectedId: id }),
    setLang: (lang) => set({ lang }),
    setDevice: (device) => set({ device }),

    updateContent: (id, content, group) => change((doc) => ops.setContent(doc, id, content), group),
    setTextAt: (id, path, text) => change((doc) => ops.setTextAt(doc, id, path, text, get().lang)),

    addSection: (type, variant) => {
      const { doc, selectedId, commit } = get();
      const result = doc && ops.addSection(doc, type, variant, selectedId);
      if (!result) return;
      commit(result.doc);
      set({ selectedId: result.id });
    },

    removeSection: (id) => change((doc) => ops.removeSection(doc, id)),

    duplicateSection: (id) => {
      const { doc, commit } = get();
      const result = doc && ops.duplicateSection(doc, id);
      if (!result) return;
      commit(result.doc);
      set({ selectedId: result.id });
    },

    moveSection: (id, delta) => change((doc) => ops.moveSection(doc, id, delta)),
    moveSectionTo: (id, targetId) => change((doc) => ops.moveSectionTo(doc, id, targetId)),
    toggleHidden: (id) => change((doc) => ops.toggleHidden(doc, id)),
    setVariant: (id, variant) => change((doc) => ops.setVariant(doc, id, variant)),
    setSectionStyle: (id, style) => change((doc) => ops.setSectionStyle(doc, id, style)),
    setTheme: (theme, group) =>
      change((doc) => ({ ...doc, theme: { ...doc.theme, ...theme } }), group),
    setFamily: (family, keepColors) => change((doc) => applyFamily(doc, family, { keepColors })),
    setMeta: (meta, group) => change((doc) => ({ ...doc, meta: { ...doc.meta, ...meta } }), group),
    setLanguages: (languages) => change((doc) => ops.setLanguages(doc, languages)),
  };
});

/** Name shown for a section in lists: its type name. */
export function sectionName(section: Section): string {
  return getSection(section.type)?.name ?? section.type;
}
