import { AI_DAILY_LIMIT } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

/** Free Gemini models that answered well in English and Arabic (checked November 2026). */
const DEFAULT_MODELS = "gemini-3.1-flash-lite,gemini-flash-lite-latest";

/** Settings for any model service that speaks the OpenAI chat format (Gemini, Groq, OpenRouter, ...). */
export function aiSettings() {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  return {
    key,
    baseUrl: (
      process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"
    ).replace(/\/$/, ""),
    /** Tried in order: when one is overloaded or slow, the next one answers. */
    models: (process.env.AI_MODEL || DEFAULT_MODELS)
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  };
}

type Settings = NonNullable<ReturnType<typeof aiSettings>>;
type Message = { role: "system" | "user"; content: string };

/**
 * Checks the visitor is logged in and Pro, and takes one use from today's allowance. Returns the
 * uses left, or an error code for the client.
 */
export async function takeAiCredit(): Promise<
  { left: number } | { error: string; status: number }
> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { error: "login", status: 401 };
  const { data: left, error } = await supabase.rpc("use_ai_credit", {
    p_daily_limit: AI_DAILY_LIMIT,
  });
  if (error) return { error: "setup", status: 503 };
  if (left === -1) return { error: "pro", status: 403 };
  if (left === -2) return { error: "limit", status: 429 };
  return { left: Number(left) };
}

/** Sends the messages to each model in turn until one answers. */
export async function runModel(
  ai: Settings,
  messages: Message[],
  options: { temperature: number; maxTokens: number; timeoutMs?: number },
): Promise<{ answer: string } | { problem: "busy" | "model" }> {
  let problem: "busy" | "model" = "model";
  for (const model of ai.models) {
    try {
      const response = await fetch(`${ai.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${ai.key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
      });
      if (response.status === 429 || response.status === 503) {
        problem = "busy";
        continue;
      }
      if (!response.ok) continue;
      const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const answer = body.choices?.[0]?.message?.content ?? "";
      if (answer.trim()) return { answer };
    } catch {
      problem = "busy";
    }
  }
  return { problem };
}
