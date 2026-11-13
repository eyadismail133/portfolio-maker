import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Small interface pieces shared by the editor panels and app screens. */

const PATHS = {
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff:
    "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.6 8.5 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  plus: "M12 5v14M5 12h14",
  undo: "M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12h-2",
  redo: "M15 7l5 5-5 5M20 12H10a6 6 0 0 0 0 12h2",
  desktop: "M3 5h18v11H3zM8 20h8M12 16v4",
  tablet: "M6 3h12v18H6zM11 18h2",
  phone: "M8 3h8v18H8zM11 18h2",
  close: "M6 6l12 12M18 6L6 18",
  expand: "M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5",
  shrink: "M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  shuffle: "M3 7h4l10 10h4M17 7h4M3 17h4l3-3M14 10l3-3M18 4l3 3-3 3M18 14l3 3-3 3",
  sparkles:
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16zM5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6L5 17z",
  check: "M20 6L9 17l-5-5",
  globe:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  palette:
    "M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C23 5.4 18 2 12 2zM6.5 11.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  fileText:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
} as const;

export type UiIconName = keyof typeof PATHS;

export function UiIcon({
  name,
  size = 16,
  className = "",
}: {
  name: UiIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "grip" ? 2.6 : 1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Signature geometric prism brand mark for Portfolio Maker. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "sm"
      ? "size-7 rounded-lg"
      : size === "lg"
        ? "size-10 rounded-xl"
        : "size-8 rounded-xl";
  const iconSize = size === "sm" ? 15 : size === "lg" ? 20 : 17;
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${dims} shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}
    >
      <UiIcon name="layers" size={iconSize} />
    </span>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: UiIconName;
  label: string;
};

/** A square button that shows only an icon. `label` is read by screen readers and shown on hover. */
export function IconButton({ icon, label, className = "", ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 ${className}`}
      {...rest}
    >
      <UiIcon name={icon} />
    </button>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-300/90 bg-white px-3 py-2 text-sm text-zinc-900 shadow-2xs transition-all duration-150 placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-blue-500 dark:focus:ring-blue-500/20";

export const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300/90 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-800 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50/90 hover:shadow-xs active:translate-y-0 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700/90 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

export const primaryButtonClass =
  "pm-btn-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-400"
    >
      {children}
    </label>
  );
}

/** A row of choices where exactly one is active. */
export { Segmented } from "./Segmented";

export function PanelHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{children}</h3>;
}
