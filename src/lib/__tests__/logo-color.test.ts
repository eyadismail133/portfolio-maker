import { describe, expect, test } from "vitest";
import { brandColorFromPixels } from "../logo-color";

/** RGBA pixels: each entry is [r, g, b, a] repeated `count` times. */
function pixels(...runs: [number, number, number, number, number][]): number[] {
  return runs.flatMap(([r, g, b, a, count]) =>
    Array.from({ length: count }, () => [r, g, b, a]).flat(),
  );
}

describe("brand color from a logo", () => {
  test("the strongest real color wins over white, black and grey", () => {
    const logo = pixels(
      [255, 255, 255, 255, 500], // white background
      [20, 20, 20, 255, 200], // black text
      [128, 128, 128, 255, 100], // grey line
      [31, 79, 216, 255, 120], // blue mark
    );
    expect(brandColorFromPixels(logo)).toBe("#1f4fd8");
  });

  test("a small strong color beats a larger washed-out one", () => {
    const logo = pixels([200, 190, 180, 255, 300], [210, 30, 60, 255, 60]);
    expect(brandColorFromPixels(logo)).toBe("#d21e3c");
  });

  test("transparent pixels are ignored", () => {
    const logo = pixels([0, 200, 0, 0, 1000], [180, 90, 10, 255, 20]);
    expect(brandColorFromPixels(logo)).toBe("#b45a0a");
  });

  test("a black logo on white gives its ink, and an empty picture gives nothing", () => {
    expect(brandColorFromPixels(pixels([255, 255, 255, 255, 50], [30, 30, 40, 255, 10]))).toBe(
      "#1e1e28",
    );
    expect(brandColorFromPixels(pixels([255, 255, 255, 255, 50]))).toBeNull();
    expect(brandColorFromPixels(pixels([0, 0, 0, 0, 50]))).toBeNull();
  });
});
