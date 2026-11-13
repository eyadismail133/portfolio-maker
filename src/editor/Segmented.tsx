"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { spring } from "@/lib/motion";

/** A row of options where exactly one is chosen, with a chip that slides to the choice. */
export function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div
      role="group"
      aria-label={props.label}
      className="flex rounded-lg border border-zinc-200/90 bg-zinc-100/80 p-1 shadow-inner dark:border-zinc-800 dark:bg-zinc-950/80"
    >
      {props.options.map(([value, name]) => {
        const active = props.value === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => props.onChange(value)}
            className={`relative flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-600 ${
              active
                ? "text-zinc-950 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {/* The white chip slides to the chosen option instead of jumping. */}
            {active && (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-md bg-white shadow-xs ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10"
                transition={spring.layout}
              />
            )}
            <span className="relative">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
