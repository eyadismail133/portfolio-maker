import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AI_ACTIONS, AI_MAX_INPUT, buildMessages, cleanAnswer } from "@/lib/ai/prompts";
import { aiSettings, runModel, takeAiCredit } from "@/lib/ai/server";

const requestSchema = z.object({
  action: z.enum(AI_ACTIONS),
  text: z.string().max(AI_MAX_INPUT * 2),
  lang: z.enum(["en", "ar"]),
  context: z.string().max(300),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Writing help for Pro accounts. The database decides who is Pro and counts uses per day. */
export async function POST(request: NextRequest) {
  const ai = aiSettings();
  if (!ai) return fail("setup", 503);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("invalid", 400);
  if (parsed.data.action !== "write" && !parsed.data.text.trim()) return fail("empty", 400);

  const credit = await takeAiCredit();
  if ("error" in credit) return fail(credit.error, credit.status);

  const result = await runModel(ai, buildMessages(parsed.data), {
    temperature: parsed.data.action === "translate" ? 0.2 : 0.6,
    maxTokens: 900,
  });
  if ("problem" in result) return fail(result.problem, result.problem === "busy" ? 503 : 502);
  const text = cleanAnswer(result.answer);
  if (!text) return fail("model", 502);
  return NextResponse.json({ text, left: credit.left });
}
