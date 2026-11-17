/**
 * Finds the brand color in a logo: the strongest real color among its pixels, leaving out
 * transparent, near-white, near-black and grey pixels. A logo with no real color (black on
 * white) gives its darkest ink instead. The pixels come from a small canvas in the browser, so
 * the logo itself is never uploaded.
 */

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** RGBA pixels, four numbers each, as `getImageData` gives them. Null when the picture is empty. */
export function brandColorFromPixels(data: ArrayLike<number>): string | null {
  // Colors grouped into buckets of 32 steps per channel; each bucket keeps its sum to average.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number; weight: number }>();
  let ink: { r: number; g: number; b: number; n: number } | null = null;
  let any = false;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 235) continue; // white or nearly
    any = true;
    const spread = max - min;
    if (spread < 28 || max < 28) {
      // Black or grey: remembered as ink in case the logo has no color at all.
      if (max < 200) {
        ink ??= { r: 0, g: 0, b: 0, n: 0 };
        ink.r += r;
        ink.g += g;
        ink.b += b;
        ink.n += 1;
      }
      continue;
    }
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0, weight: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    // Strong colors count more than washed-out ones of the same area.
    bucket.weight += spread / 255;
    buckets.set(key, bucket);
  }
  let best: { r: number; g: number; b: number; n: number; weight: number } | null = null;
  for (const bucket of buckets.values()) if (!best || bucket.weight > best.weight) best = bucket;
  if (best) return toHex(best.r / best.n, best.g / best.n, best.b / best.n);
  if (ink) return toHex(ink.r / ink.n, ink.g / ink.n, ink.b / ink.n);
  return any ? "#111111" : null;
}

/** Reads a picture the person chose and returns its brand color, in the browser. */
export async function brandColorFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const size = 64;
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return brandColorFromPixels(context.getImageData(0, 0, width, height).data);
}
