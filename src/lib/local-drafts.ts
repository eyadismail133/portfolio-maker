import { normalizeDoc } from "@/render-kit/registry";
import type { PortfolioDoc } from "@/render-kit/schema/document";

/** Small pieces of work kept in the browser: the try-it draft, a portfolio waiting for login, unsynced edits. */

export const DRAFT_KEY = "portfolio-maker:draft";
const PENDING_KEY = "portfolio-maker:pending";
const ANSWERS_KEY = "portfolio-maker:answers";
const unsyncedKey = (id: string) => `portfolio-maker:unsynced:${id}`;

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove when storage is unavailable.
  }
}

function asDoc(raw: unknown): PortfolioDoc | null {
  try {
    return raw ? normalizeDoc(raw) : null;
  } catch {
    return null;
  }
}

/** The draft from the open editor at /editor. */
export const readDraft = () => asDoc(read(DRAFT_KEY));
export const writeDraft = (doc: PortfolioDoc) => write(DRAFT_KEY, doc);
export const clearDraft = () => remove(DRAFT_KEY);

/** A portfolio chosen before logging in. The dashboard saves it to the account on arrival. */
export type Pending = { doc: PortfolioDoc; title: string; answers?: unknown };

export function readPending(): Pending | null {
  const raw = read(PENDING_KEY) as { doc?: unknown; title?: unknown; answers?: unknown } | null;
  const doc = asDoc(raw?.doc);
  return doc
    ? { doc, title: typeof raw?.title === "string" ? raw.title : "", answers: raw?.answers }
    : null;
}
export const writePending = (pending: Pending) => write(PENDING_KEY, pending);
export const clearPending = () => remove(PENDING_KEY);

/**
 * Edits to a saved portfolio that have not reached the server yet. `base` is the server version
 * they were made on; they are only used again if the server still has that version.
 */
export function readUnsynced(id: string, serverVersion: string): PortfolioDoc | null {
  const raw = read(unsyncedKey(id)) as { doc?: unknown; base?: unknown } | null;
  return raw?.base === serverVersion ? asDoc(raw.doc) : null;
}
export const writeUnsynced = (id: string, doc: PortfolioDoc, base: string) =>
  write(unsyncedKey(id), { doc, base });
export const clearUnsynced = (id: string) => remove(unsyncedKey(id));

/** Answers to the onboarding questions, kept so the ideas page can be reloaded or revisited. */
export const readAnswers = () => read(ANSWERS_KEY);
export const writeAnswers = (answers: unknown) => write(ANSWERS_KEY, answers);
