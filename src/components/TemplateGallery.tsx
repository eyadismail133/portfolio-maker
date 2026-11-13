"use client";

import Link from "next/link";
import { useMemo } from "react";
import { UiIcon } from "@/editor/ui";
import { templateDoc, TEMPLATES } from "@/lib/templates";
import { MiniPreview } from "./MiniPreview";
import { TiltCard } from "./TiltCard";

export function TemplateGallery() {
  const docs = useMemo(() => TEMPLATES.map((t) => templateDoc(t.id)!), []);
  return (
    <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((template, i) => (
        <TiltCard
          key={template.id}
          reveal={(i % 3) * 0.06}
          className="pm-card-interactive group flex flex-col overflow-hidden rounded-2xl p-2"
        >
          <div aria-hidden="true" className="mb-2 flex items-center gap-1.5 px-2 pt-1">
            <span className="size-2 rounded-full bg-rose-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
            <span
              data-no-translate
              className="ms-2 truncate rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-500"
            >
              /templates/{template.id}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
              <MiniPreview doc={docs[i]} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3.5 p-3.5 pt-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{template.name}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{template.forWhom}</p>
            </div>
            <Link
              href={`/editor?template=${template.id}`}
              className="group/btn mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300/90 bg-zinc-50/70 px-4 py-2.5 text-center text-sm font-semibold text-zinc-800 transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-600/20 dark:border-zinc-700/90 dark:bg-zinc-800/50 dark:text-zinc-100 dark:hover:border-blue-500 dark:hover:bg-blue-600"
            >
              <span>Use this template</span>
              <UiIcon
                name="arrowRight"
                size={14}
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5"
              />
            </Link>
          </div>
        </TiltCard>
      ))}
    </ul>
  );
}
