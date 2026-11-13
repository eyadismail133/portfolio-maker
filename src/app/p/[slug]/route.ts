import { publishedResponse } from "@/lib/published-response";

/** A published portfolio in its first language, as one complete HTML page. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return publishedResponse(request, slug);
}
