"use client";

import Link from "next/link";
import { useMemo } from "react";
import { templateDoc, TEMPLATES } from "@/lib/templates";
import { MiniPreview } from "./MiniPreview";

export function TemplateGallery() {
  const docs = useMemo(() => TEMPLATES.map((t) => templateDoc(t.id)!), []);
  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((template, i) => (
        <li
          key={template.id}
          className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <MiniPreview doc={docs[i]} className="border-b border-zinc-200 dark:border-zinc-800" />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <h2 className="font-semibold">{template.name}</h2>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{template.forWhom}</p>
            </div>
            <Link
              href={`/editor?template=${template.id}`}
              className="mt-auto rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Use this template
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
