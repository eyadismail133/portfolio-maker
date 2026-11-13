"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion";

/**
 * One motion setting for the whole app. With the system's "reduce motion" on, movement and
 * scaling are switched off and only fades remain.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease: ease.out }}>
      {children}
    </MotionConfig>
  );
}
