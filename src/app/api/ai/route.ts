import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AI_ACTIONS, AI_MAX_INPUT, buildMessages, cleanAnswer } from "@/lib/ai/prompts";
import { AI_DAILY_LIMIT } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  action: z.enum(AI_ACTIONS),
  text: z.string().max(AI_MAX_INPUT * 2),
  lang: z.enum(["en", "ar"]),
  context: z.string().max(300),
});

/** Settings for any model service that speaks the OpenAI chat format (Gemini, Groq, OpenRouter, ...). */
function settings() {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  return {
    key,
    baseUrl: (
      process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"
    ).replace(/\/$/, ""),
    model: process.env.AI_MODEL || "gemini-2.5-flash",
  };
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Writing help for Pro accounts. The database decides who is Pro and counts uses per day. */
export async function POST(request: NextRequest) {
  const ai = settings();
  if (!ai) return fail("setup", 503);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("invalid", 400);
  if (parsed.data.action !== "write" && !parsed.data.text.trim()) return fail("empty", 400);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return fail("login", 401);

  const { data: left, error } = await supabase.rpc("use_ai_credit", {
    p_daily_limit: AI_DAILY_LIMIT,
  });
  if (error) return fail("setup", 503);
  if (left === -1) return fail("pro", 403);
  if (left === -2) return fail("limit", 429);

  try {
    const response = await fetch(`${ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${ai.key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: ai.model,
        messages: buildMessages(parsed.data),
        temperature: parsed.data.action === "translate" ? 0.2 : 0.6,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) return fail("busy", 503);
    if (!response.ok) return fail("model", 502);
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = cleanAnswer(body.choices?.[0]?.message?.content ?? "");
    if (!text) return fail("model", 502);
    return NextResponse.json({ text, left });
  } catch {
    return fail("model", 502);
  }
}
