import type { Palette } from "../schema/document";

type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

export function hexToHsl(hex: string) {
  return rgbToHsl(hexToRgb(hex));
}

/** Relative luminance from WCAG 2. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio from WCAG 2: 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Returns `color` if it is readable on `background`, otherwise the nearest lighter or darker
 * shade of it that reaches the wanted contrast.
 */
export function ensureContrast(color: string, background: string, min = 4.5): string {
  if (contrastRatio(color, background) >= min) return color;
  const [h, s, l] = hexToHsl(color);
  const darken = luminance(background) > 0.4;
  for (let step = 1; step <= 50; step += 1) {
    const next = darken ? l - step * 0.02 : l + step * 0.02;
    if (next < 0 || next > 1) break;
    const candidate = hslToHex(h, s, next);
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return darken ? "#000000" : "#ffffff";
}

/** Black or white, whichever is easier to read on the color. */
export function readableOn(color: string): string {
  return contrastRatio("#ffffff", color) >= contrastRatio("#111111", color) ? "#ffffff" : "#111111";
}

/** Builds a complete palette from a single brand color. Text contrast always passes WCAG AA. */
export function buildPalette(brand: string, mode: "light" | "dark" = "light"): Palette {
  const [h, s] = hexToHsl(brand);
  const tint = Math.min(s, 0.25);
  const light = mode === "light";
  const background = light ? hslToHex(h, tint * 0.3, 0.99) : hslToHex(h, tint * 0.6, 0.07);
  const surface = light ? hslToHex(h, tint * 0.6, 0.955) : hslToHex(h, tint * 0.6, 0.115);
  const text = light ? hslToHex(h, tint, 0.1) : hslToHex(h, tint * 0.4, 0.94);
  const mutedText = ensureContrast(
    light ? hslToHex(h, tint * 0.6, 0.4) : hslToHex(h, tint * 0.5, 0.68),
    surface,
  );
  const primary = ensureContrast(brand, background, 4.5);
  const accent = ensureContrast(
    hslToHex((h + 150) % 360, Math.max(s * 0.8, 0.35), light ? 0.36 : 0.66),
    background,
  );
  return {
    background,
    surface,
    text,
    mutedText,
    primary,
    onPrimary: readableOn(primary),
    accent,
    border: light ? hslToHex(h, tint * 0.6, 0.87) : hslToHex(h, tint * 0.6, 0.2),
  };
}

/** Repairs a hand-edited palette so every text color is readable where it is used. */
export function fixPalette(p: Palette): Palette {
  const text = ensureContrast(p.text, p.background, 7);
  const primary = ensureContrast(p.primary, p.background, 4.5);
  return {
    ...p,
    text,
    mutedText: ensureContrast(ensureContrast(p.mutedText, p.background), p.surface),
    primary,
    onPrimary: contrastRatio(p.onPrimary, primary) >= 4.5 ? p.onPrimary : readableOn(primary),
    accent: ensureContrast(p.accent, p.background, 4.5),
  };
}

/** Lists the text and background pairs of a palette that are hard to read. */
export function contrastProblems(p: Palette): string[] {
  const checks: [string, string, string, number][] = [
    ["text on background", p.text, p.background, 4.5],
    ["text on surface", p.text, p.surface, 4.5],
    ["muted text on background", p.mutedText, p.background, 4.5],
    ["muted text on surface", p.mutedText, p.surface, 4.5],
    ["primary on background", p.primary, p.background, 4.5],
    ["text on primary", p.onPrimary, p.primary, 4.5],
    ["accent on background", p.accent, p.background, 4.5],
  ];
  return checks.filter(([, fg, bg, min]) => contrastRatio(fg, bg) < min).map(([name]) => name);
}
