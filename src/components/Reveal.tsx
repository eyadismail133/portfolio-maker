"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, inView, staggerParent } from "@/lib/motion";

type Tag = "div" | "section" | "ul" | "ol" | "li" | "p" | "h2";

/** Fades and lifts its content once, when it scrolls into view. */
export function Reveal({
  children,
  className,
  as = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  delay?: number;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}

/** A list whose items arrive one after another when the list scrolls into view. */
export function RevealList({
  children,
  className,
  as = "ul",
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  as?: "ul" | "ol" | "div";
  stagger?: number;
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={staggerParent(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={inView}
    >
      {children}
    </Component>
  );
}

/** One item of a RevealList. */
export function RevealItem({
  children,
  className,
  as = "li",
}: {
  children: ReactNode;
  className?: string;
  as?: "li" | "div";
}) {
  const Component = motion[as];
  return (
    <Component className={className} variants={fadeUp}>
      {children}
    </Component>
  );
}
