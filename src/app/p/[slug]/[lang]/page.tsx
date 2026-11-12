import { Suspense } from "react";
import { PublishedPage, publishedMetadata } from "@/components/PublishedPage";

export async function generateMetadata({ params }: PageProps<"/p/[slug]/[lang]">) {
  const { slug, lang } = await params;
  return publishedMetadata(slug, lang);
}

async function Content({ params }: { params: PageProps<"/p/[slug]/[lang]">["params"] }) {
  const { slug, lang } = await params;
  return <PublishedPage slug={slug} wanted={lang} />;
}

export default function Page({ params }: PageProps<"/p/[slug]/[lang]">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
