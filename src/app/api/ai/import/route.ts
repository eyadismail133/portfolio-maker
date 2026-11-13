import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { IMPORT_MAX_INPUT, importMessages, parseImport } from "@/lib/ai/cv-import";
import { aiSettings, runModel, takeAiCredit } from "@/lib/ai/server";

const requestSchema = z.object({
  text: z
    .string()
    .min(40)
    .max(IMPORT_MAX_INPUT * 2),
});
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Reads the text of a CV or LinkedIn PDF into portfolio data (Pro). Uses one AI use. */
export async function POST(request: NextRequest) {
  const ai = aiSettings();
  if (!ai) return fail("setup", 503);
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("empty", 400);

  const credit = await takeAiCredit();
  if ("error" in credit) return fail(credit.error, credit.status);

  const result = await runModel(ai, importMessages(parsed.data.text), {
    temperature: 0.1,
    maxTokens: 4000,
    timeoutMs: 45_000,
  });
  if ("problem" in result) return fail(result.problem, result.problem === "busy" ? 503 : 502);
  const data = parseImport(result.answer);
  if (!data) return fail("model", 502);
  return NextResponse.json({ data, left: credit.left });
}
