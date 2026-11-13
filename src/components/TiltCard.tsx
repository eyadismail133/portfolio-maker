"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { fadeUp, inView, spring } from "@/lib/motion";

/**
 * A card that leans slightly toward the pointer, like a print picked up to look at. Only with a
 * mouse (not touch) and never with reduced motion. Motion values update outside React, so the
 * card does not re-render while the pointer moves.
 */
export function TiltCard({
  children,
  className,
  as = "li",
  style,
  reveal,
}: {
  children: ReactNode;
  className?: string;
  as?: "li" | "div";
  style?: React.CSSProperties;
  /** Fade the card in when it scrolls into view, after this many seconds. */
  reveal?: number;
}) {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), spring.soft);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), spring.soft);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    Promise.resolve().then(() => setFinePointer(query.matches));
  }, []);

  const active = finePointer && !reduced;
  const Component = motion[as];
  return (
    <Component
      className={className}
      {...(reveal !== undefined && {
        variants: fadeUp,
        initial: "hidden",
        whileInView: "show",
        viewport: inView,
        transition: { delay: reveal },
      })}
      style={active ? { ...style, rotateX, rotateY, transformPerspective: 1000 } : style}
      onPointerMove={(event) => {
        if (!active) return;
        const box = event.currentTarget.getBoundingClientRect();
        mx.set((event.clientX - box.left) / box.width - 0.5);
        my.set((event.clientY - box.top) / box.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </Component>
  );
}
