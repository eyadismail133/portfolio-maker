import type { Transition, Variants } from "motion/react";

/**
 * Motion tokens for the app interface (never for portfolio pages, which stay plain CSS).
 * Import these instead of writing durations by hand, so the whole app moves the same way.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  cinematic: [0.16, 1, 0.3, 1],
} as const;

export const spring = {
  /** Presses, toggles, small controls. */
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  /** Hover tilt and anything that follows the pointer. */
  soft: { type: "spring", stiffness: 180, damping: 24 },
  /** Sliding indicators and items changing place. */
  layout: { type: "spring", bounce: 0.18, visualDuration: 0.45 },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: ease.out } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: ease.out } },
};

export const staggerParent = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Delay for item `i` of a list, capped so long lists do not crawl in. */
export const staggerDelay = (i: number, step = 0.05) => Math.min(i, 12) * step;

/** Reveal once, a little before the element is fully on screen. */
export const inView = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const;
