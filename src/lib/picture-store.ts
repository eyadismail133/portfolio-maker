import { uploadImage } from "@/lib/upload";
import { withPicture, type PictureKind } from "@/recommend/picture";
import type { PortfolioDoc } from "@/render-kit/schema/document";

/**
 * The photo or logo chosen in onboarding, kept in the browser (IndexedDB) until the person has an
 * account. It is uploaded and put into the page when the portfolio is created.
 */

const DB = "portfolio-maker";
const STORE = "files";
const KEY = "onboarding-picture";

export type StoredPicture = { file: Blob; name: string; kind: PictureKind };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function readPicture(): Promise<StoredPicture | null> {
  try {
    const value = (await run("readonly", (s) => s.get(KEY))) as StoredPicture | undefined;
    return value?.file instanceof Blob ? value : null;
  } catch {
    return null;
  }
}

export async function writePicture(picture: StoredPicture): Promise<boolean> {
  try {
    await run("readwrite", (s) => s.put(picture, KEY));
    return true;
  } catch {
    return false;
  }
}

export async function clearPicture(): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } catch {
    // Nothing kept, nothing to clear.
  }
}

/**
 * Uploads the kept picture and returns the page with it in place. If there is no picture, or the
 * upload fails, the page comes back unchanged and the person can add it in the editor.
 */
export async function addStoredPicture(doc: PortfolioDoc): Promise<PortfolioDoc> {
  const picture = await readPicture();
  if (!picture) return doc;
  try {
    const file = new File([picture.file], picture.name || "picture", { type: picture.file.type });
    const asset = await uploadImage(file);
    await clearPicture();
    const name = doc.meta.title.split(",")[0].trim();
    const alt = picture.kind === "logo" ? `${name || "Company"} logo` : name;
    return withPicture(doc, { ...asset, alt }, picture.kind);
  } catch {
    return doc;
  }
}
