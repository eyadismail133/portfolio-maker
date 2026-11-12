import type { Palette, Theme } from "../schema/document";
import type { Lang } from "../schema/primitives";
import { buildPalette, fixPalette } from "./color";
import { fontStacks } from "./fonts";

const RADIUS = {
  none: { box: "0px", control: "0px" },
  small: { box: "6px", control: "6px" },
  large: { box: "18px", control: "12px" },
  pill: { box: "24px", control: "999px" },
} as const;

const SPACE = { compact: "0.7", normal: "1", airy: "1.35" } as const;

const NAMES: [keyof Palette, string][] = [
  ["background", "bg"],
  ["surface", "surface"],
  ["text", "text"],
  ["mutedText", "muted"],
  ["primary", "primary"],
  ["onPrimary", "on-primary"],
  ["accent", "accent"],
  ["border", "border"],
];

/**
 * The theme as CSS variables for the page root. Light colors go in `--pk-l-*`, dark colors in
 * `--pk-d-*`; styles/base.css picks the set to use from `data-pk-mode`.
 */
export function themeToCssVars(theme: Theme, lang: Lang): Record<string, string> {
  const light = fixPalette(theme.palette);
  const dark = fixPalette(theme.paletteDark ?? buildPalette(theme.palette.primary, "dark"));
  const fonts = fontStacks(theme.fonts, lang);
  const vars: Record<string, string> = {
    "--pk-font-heading": fonts.heading,
    "--pk-font-body": fonts.body,
    "--pk-radius": RADIUS[theme.radius].box,
    "--pk-radius-control": RADIUS[theme.radius].control,
    "--pk-space-scale": SPACE[theme.spacing],
  };
  for (const [key, name] of NAMES) {
    vars[`--pk-l-${name}`] = light[key];
    vars[`--pk-d-${name}`] = dark[key];
  }
  return vars;
}
