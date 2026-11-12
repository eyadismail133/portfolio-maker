import { Suspense } from "react";
import { PublishedPage, publishedMetadata } from "@/components/PublishedPage";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  return publishedMetadata(slug);
}

async function Content({ params }: { params: PageProps<"/p/[slug]">["params"] }) {
  const { slug } = await params;
  return <PublishedPage slug={slug} />;
}

export default function Page({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
