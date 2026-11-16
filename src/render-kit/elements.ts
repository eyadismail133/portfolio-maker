import type { ElementProps } from "./registry";
import type { ElementStyle } from "./schema/document";

/** The `pk-e-*` classes for one element style. The CSS is in `styles/elements.css`. */
export function elementClasses(style: ElementStyle | undefined): string[] {
  if (!style) return [];
  const classes: string[] = [];
  if (style.color) classes.push(`pk-e-c-${style.color}`);
  if (style.size) classes.push(`pk-e-s-${style.size}`);
  if (style.weight) classes.push(`pk-e-w-${style.weight}`);
  if (style.align) classes.push(`pk-e-a-${style.align}`);
  if (style.flip) classes.push("pk-e-flip");
  if (style.order) classes.push(`pk-e-o-${style.order}`);
  return classes;
}

/**
 * Props for one element of a section (see `SectionContext.el`). A hidden element is left out of
 * the page with the `hidden` attribute; in the editor it stays visible, marked, so it can be
 * shown again.
 */
export function elementProps(
  elements: Record<string, ElementStyle> | undefined,
  editing: boolean,
  key: string | undefined,
  className?: string,
): ElementProps {
  const style = key ? elements?.[key] : undefined;
  const classes = [className, ...elementClasses(style)].filter(Boolean).join(" ");
  const props: ElementProps = {};
  if (classes) props.className = classes;
  if (editing && key) props["data-pk-el"] = key;
  if (style?.hidden) {
    if (editing) props["data-pk-el-hidden"] = "";
    else props.hidden = true;
  }
  return props;
}
