import { SCHEMA_VERSION } from "./document";
import { fillItemIds } from "./item-ids";

type RawDoc = Record<string, unknown>;

/**
 * One function per old version: `migrations[1]` turns a version 1 document into version 2.
 * Add an entry every time SCHEMA_VERSION is bumped. Never edit an old entry.
 */
export const migrations: Record<number, (doc: RawDoc) => RawDoc> = {
  /**
   * Version 2: every list item in section content gets an id ("i1", "i2"... inside its section),
   * and sections may carry element styles. Old documents have none, which means "as the design
   * does it", so only the ids are added.
   */
  1: (doc) => ({
    ...doc,
    sections: Array.isArray(doc.sections)
      ? doc.sections.map((section: unknown) =>
          typeof section === "object" && section !== null && "content" in section
            ? { ...section, content: fillItemIds((section as { content: unknown }).content) }
            : section,
        )
      : doc.sections,
  }),
};

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
