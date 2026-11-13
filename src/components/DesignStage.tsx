"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ease, spring } from "@/lib/motion";
import { createSampleDoc } from "@/render-kit/samples";
import { families } from "@/render-kit/themes/families";
import { MiniPreview } from "./MiniPreview";

const STEP_MS = 3400;

/**
 * The home page's live demo of the product's promise: one portfolio, every design. The same
 * content is shown in each design family in turn; a new design wipes across the old one from
 * the reading side. Visitors can pick a design themselves; autoplay pauses on hover, on focus,
 * once someone picks, and while the tab is hidden. With reduced motion it does not autoplay.
 */
export function DesignStage() {
  // The server cannot know the visitor's motion setting, so the first render assumes motion
  // and the real setting applies right after (otherwise the page would not match the server's).
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion() && mounted;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [picked, setPicked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [rtl, setRtl] = useState(false);
  // On a phone the stage shows the portfolio's own phone layout, which is readable at that size.
  const [narrow, setNarrow] = useState(false);
  const playing = !reduced && !hovered && !picked && !hidden;

  const family = families[index];
  const doc = useMemo(() => createSampleDoc({ family: family.id, languages: ["en"] }), [family.id]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    // Follow the window when it is resized across the phone width.
    const phone = window.matchMedia("(max-width: 639px)");
    const onPhone = () => setNarrow(phone.matches);
    phone.addEventListener("change", onPhone);
    document.addEventListener("visibilitychange", onVisibility);
    Promise.resolve().then(() => {
      setRtl(document.documentElement.dir === "rtl");
      setNarrow(phone.matches);
      setMounted(true);
    });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      phone.removeEventListener("change", onPhone);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % families.length), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, index]);

  // The wipe starts on the side people read from: the left in English, the right in Arabic.
  const hiddenClip = rtl ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";

  return (
    <figure
      className="mt-16"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="pm-stage-frame relative overflow-hidden rounded-[1.4rem] p-2 sm:p-2.5">
        <div aria-hidden="true" className="flex items-center gap-1.5 px-2 pb-2 pt-0.5">
          <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span
            data-no-translate
            className="ms-2 rounded-full bg-zinc-100 px-3 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          >
            yoursite/p/layla
          </span>
          <span className="ms-auto hidden font-mono text-[11px] tabular-nums text-zinc-400 sm:inline">
            {String(index + 1).padStart(2, "0")} / {families.length}
          </span>
        </div>
        <div
          className={`relative isolate ${narrow ? "aspect-[4/5]" : "aspect-[16/10]"} overflow-hidden rounded-[1rem] bg-white ring-1 ring-zinc-900/10 dark:ring-white/10`}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={family.id}
              className="absolute inset-0"
              initial={reduced ? { opacity: 0 } : { clipPath: hiddenClip }}
              animate={reduced ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
              exit={{ opacity: 0.999, transition: { duration: 0.9 } }}
              transition={{ duration: 0.85, ease: ease.inOut }}
              style={{ zIndex: 1 }}
            >
              <MiniPreview
                doc={doc}
                aspect={narrow ? "aspect-[4/5]" : "aspect-[16/10]"}
                pageWidth={narrow ? 400 : 1280}
              />
              {!reduced && (
                // A bright edge rides the wipe, so the change reads as one sweep.
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  initial={{ x: rtl ? "100%" : "-100%", opacity: 1 }}
                  animate={{ x: "0%", opacity: [1, 1, 0] }}
                  transition={{
                    duration: 0.85,
                    ease: ease.inOut,
                    opacity: { times: [0, 0.8, 1], duration: 0.95 },
                  }}
                >
                  <span
                    className="pm-stage-edge absolute inset-y-0 w-[3px]"
                    style={rtl ? { left: 0 } : { right: 0 }}
                  />
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Time left before the next design, so the change never surprises. */}
        <div className="relative mx-2 mt-2.5 h-0.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            key={`${index}-${playing}`}
            className="absolute inset-y-0 start-0 w-full origin-left rounded-full bg-zinc-900 rtl:origin-right dark:bg-zinc-100"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: playing ? 1 : 0 }}
            transition={playing ? { duration: STEP_MS / 1000, ease: "linear" } : { duration: 0.2 }}
          />
        </div>
      </div>

      <LayoutGroup id="design-stage">
        <div
          role="group"
          aria-label="Designs"
          className="pm-no-scrollbar -mx-5 mt-4 flex gap-1 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {families.map((f, i) => {
            const active = i === index;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPicked(true);
                  setIndex(i);
                }}
                className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${active ? "text-white dark:text-zinc-900" : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"}`}
              >
                {active && (
                  <motion.span
                    layoutId="design-stage-pill"
                    className="absolute inset-0 -z-0 rounded-full bg-zinc-900 dark:bg-zinc-100"
                    transition={spring.layout}
                  />
                )}
                <span className="relative">{f.name}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <figcaption className="mt-3 text-sm text-zinc-500">
        The same portfolio in every design. Nothing was retyped.
      </figcaption>
    </figure>
  );
}
