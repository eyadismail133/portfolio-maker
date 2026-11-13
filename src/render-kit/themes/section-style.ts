import { safeImageUrl } from "../i18n";
import type { Palette, SectionStyle } from "../schema/document";
import { contrastRatio, hexToRgb, readableOn, rgbToHex } from "./color";

/** What the Renderer puts on a section wrapper for its style. */
export type SectionLook = {
  attrs: Record<string, string>;
  vars: Record<string, string>;
};

const OVERLAYS = {
  dark: { color: "#0b0d12", alpha: 0.55 },
  darker: { color: "#0b0d12", alpha: 0.78 },
  light: { color: "#ffffff", alpha: 0.6 },
  lighter: { color: "#ffffff", alpha: 0.82 },
} as const;

const GRADIENTS = {
  down: "linear-gradient(180deg, A, B)",
  diagonal: "linear-gradient(135deg, A, B)",
  radial: "radial-gradient(circle at 30% 20%, A, B)",
} as const;

function mix(a: string, b: string): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return rgbToHex([0, 1, 2].map((i) => Math.round((x[i] + y[i]) / 2)) as [number, number, number]);
}

/** White or near black, whichever reads better on every one of the colors. */
function readableOnAll(colors: string[]): string {
  const worst = (text: string) => Math.min(...colors.map((c) => contrastRatio(text, c)));
  return worst("#ffffff") >= worst("#111111") ? "#ffffff" : "#111111";
}

/** A CSS url() that cannot break out of its quotes. */
function cssUrl(url: string): string {
  return `url("${url.replace(/["\\\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;
}

/**
 * Colors for a section with its own background: the background, readable text, and a main color
 * that still stands out on it. The CSS turns these into the usual section variables.
 */
function ownColors(bg: string, text: string, palette: Palette): Record<string, string> {
  const primary = contrastRatio(palette.primary, bg) >= 3 ? palette.primary : text;
  return {
    "--pk-x-bg": bg,
    "--pk-x-text": text,
    "--pk-x-primary": primary,
    "--pk-x-on-primary": readableOn(primary),
  };
}

/**
 * Turns a section's style into data attributes (read by styles/section-style.css) and the few
 * CSS variables that depend on chosen colors. Pure, so the page, the preview and the export agree.
 */
export function sectionLook(style: SectionStyle | undefined, palette: Palette): SectionLook {
  const attrs: Record<string, string> = {
    "data-pk-bg": style?.background ?? "default",
    "data-pk-pad": style?.padding ?? "normal",
  };
  const vars: Record<string, string> = {};
  if (!style) return { attrs, vars };

  const { background } = style;
  if (background === "custom" || background === "accent") {
    const bg = background === "accent" ? palette.accent : (style.color ?? palette.primary);
    Object.assign(vars, ownColors(bg, readableOn(bg), palette));
  } else if (background === "gradient") {
    const a = style.color ?? palette.primary;
    const b = style.color2 ?? palette.accent;
    Object.assign(vars, ownColors(mix(a, b), readableOnAll([a, b]), palette));
    vars["--pk-x-image"] = GRADIENTS[style.gradient ?? "diagonal"]
      .replace("A", a)
      .replace("B", b);
  } else if (background === "image") {
    const overlay = OVERLAYS[style.overlay ?? "dark"];
    const text = readableOn(overlay.color);
    Object.assign(vars, ownColors(overlay.color, text, palette));
    const layer = `rgb(${hexToRgb(overlay.color).join(" ")} / ${overlay.alpha})`;
    const url = safeImageUrl(style.image?.url);
    vars["--pk-x-image"] = url
      ? `linear-gradient(${layer}, ${layer}), ${cssUrl(url)}`
      : `linear-gradient(${layer}, ${layer})`;
  }

  if (style.width && style.width !== "normal") attrs["data-pk-width"] = style.width;
  if (style.align) attrs["data-pk-align"] = style.align;
  if (style.headingSize && style.headingSize !== "normal") attrs["data-pk-hsize"] = style.headingSize;
  if (style.cards) attrs["data-pk-cards"] = style.cards;
  const top = style.edgeTop ?? "none";
  const bottom = style.edgeBottom ?? "none";
  if (top !== "none" || bottom !== "none") {
    attrs["data-pk-edge"] = "";
    if (top !== "none") attrs["data-pk-edge-top"] = top;
    if (bottom !== "none") attrs["data-pk-edge-bottom"] = bottom;
  }
  if (style.entrance) attrs["data-pk-entrance"] = style.entrance;
  return { attrs, vars };
}
