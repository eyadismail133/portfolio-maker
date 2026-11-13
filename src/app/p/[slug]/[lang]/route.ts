import { publishedResponse } from "@/lib/published-response";

/** A published portfolio in one of its other languages. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; lang: string }> },
) {
  const { slug, lang } = await params;
  return publishedResponse(request, slug, lang);
}
