import { PNG } from "pngjs";

/** Compares two screenshots. Returns the share of pixels that differ, and a picture of them. */
export function difference(a: Buffer, b: Buffer): { share: number; picture: Buffer | null } {
  const one = PNG.sync.read(a);
  const two = PNG.sync.read(b);
  if (one.width !== two.width || one.height !== two.height) return { share: 1, picture: null };
  const diff = new PNG({ width: one.width, height: one.height });
  let changed = 0;
  for (let i = 0; i < one.data.length; i += 4) {
    const delta =
      Math.abs(one.data[i] - two.data[i]) +
      Math.abs(one.data[i + 1] - two.data[i + 1]) +
      Math.abs(one.data[i + 2] - two.data[i + 2]);
    const moved = delta > 48;
    if (moved) changed += 1;
    diff.data[i] = moved ? 230 : one.data[i] * 0.2 + 204;
    diff.data[i + 1] = moved ? 20 : one.data[i + 1] * 0.2 + 204;
    diff.data[i + 2] = moved ? 60 : one.data[i + 2] * 0.2 + 204;
    diff.data[i + 3] = 255;
  }
  return { share: changed / (one.width * one.height), picture: PNG.sync.write(diff) };
}
