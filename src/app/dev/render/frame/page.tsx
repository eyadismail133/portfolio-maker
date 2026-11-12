import { Suspense } from "react";
import { Renderer } from "@/render-kit/Renderer";
import { createSampleDoc } from "@/render-kit/samples";
import type { Lang } from "@/render-kit/schema";
import "@/render-kit/styles/index.css";

type Search = Promise<Record<string, string | undefined>>;

async function Frame({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const mode = q.mode === "dark" || q.mode === "both" ? q.mode : "light";
  const doc = createSampleDoc({
    palette: q.palette,
    fonts: q.fonts,
    mode,
    alternate: q.layout === "alt",
  });
  const lang: Lang = q.lang === "ar" ? "ar" : "en";
  return <Renderer doc={doc} lang={lang} />;
}

/** The sample portfolio on its own, loaded inside the frame of /dev/render. */
export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense>
      <Frame searchParams={searchParams} />
    </Suspense>
  );
}
