import { SCHEMA_VERSION } from "./document";

type RawDoc = Record<string, unknown>;

/**
 * One function per old version: `migrations[1]` turns a version 1 document into version 2.
 * Add an entry every time SCHEMA_VERSION is bumped. Never edit an old entry.
 */
export const migrations: Record<number, (doc: RawDoc) => RawDoc> = {};

/** Brings a saved document of any older version up to the current shape. */
export function migrateDoc(raw: unknown, steps = migrations, target = SCHEMA_VERSION): RawDoc {
  if (typeof raw !== "object" || raw === null)
    throw new Error("Portfolio document is not an object");
  let doc = raw as RawDoc;
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 1;
  if (version > target) {
    throw new Error(`Document version ${version} is newer than this app supports (${target})`);
  }
  while (version < target) {
    const step = steps[version];
    if (!step) throw new Error(`No migration from document version ${version}`);
    doc = { ...step(doc), schemaVersion: version + 1 };
    version += 1;
  }
  return doc;
}
