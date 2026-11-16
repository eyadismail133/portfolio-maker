/**
 * Item ids: every object inside a list of section content gets an `id` ("i1", "i2"...), unique
 * inside its section. Lists of plain texts (tags, bullet points) have no ids; their element
 * styles use the path instead.
 */

const ITEM_ID = /^i(\d+)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A text with one value per language (`{ en, ar }`): a value, never a list item. */
function isLocalizedText(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => key === "en" || key === "ar");
}

/** An object in a list that is an item and so carries an id. */
function isItem(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && !isLocalizedText(value);
}

function collectIds(value: unknown, ids: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isItem(item) && typeof item.id === "string" && item.id) ids.add(item.id);
      collectIds(item, ids);
    }
  } else if (isRecord(value)) {
    for (const key of Object.keys(value)) collectIds(value[key], ids);
  }
}

/** The next free "iN" id given the ids already in use. */
export function nextItemId(used: Iterable<string>): string {
  let max = 0;
  for (const id of used) {
    const match = ITEM_ID.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `i${max + 1}`;
}

/** Every item id used in some section content. */
export function itemIdsIn(content: unknown): Set<string> {
  const ids = new Set<string>();
  collectIds(content, ids);
  return ids;
}

/**
 * Gives every list item of the content an id, keeping the ones it has. An id used twice (a copied
 * item) is kept on the first item only. Returns the same object when nothing was missing, so
 * saved documents do not change for nothing.
 */
export function fillItemIds<T>(content: T): T {
  const used = itemIdsIn(content);
  const seen = new Set<string>();
  let changed = false;

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      let arrayChanged = false;
      const next = value.map((item) => {
        let out = walk(item);
        if (isItem(out)) {
          const id = typeof out.id === "string" ? out.id : "";
          if (!id || seen.has(id)) {
            const fresh = nextItemId(used);
            used.add(fresh);
            out = { ...out, id: fresh };
            seen.add(fresh);
          } else {
            seen.add(id);
          }
        }
        if (out !== item) arrayChanged = true;
        return out;
      });
      if (!arrayChanged) return value;
      changed = true;
      return next;
    }
    if (isRecord(value)) {
      let recordChanged = false;
      const next: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        next[key] = walk(value[key]);
        if (next[key] !== value[key]) recordChanged = true;
      }
      return recordChanged ? next : value;
    }
    return value;
  };

  const result = walk(content) as T;
  return changed ? result : content;
}
