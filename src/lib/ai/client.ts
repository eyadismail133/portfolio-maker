import type { AiRequest } from "./prompts";

const MESSAGES: Record<string, string> = {
  pro: "AI writing is part of the Pro plan.",
  limit: "You have used today's AI writing. It resets tomorrow.",
  busy: "The AI service is busy. Try again in a minute.",
  setup: "AI writing is not switched on for this site yet.",
  login: "Log in again to use AI writing.",
  empty: "Write something first, then ask the AI to work on it.",
  invalid: "That text is too long for the AI. Shorten it first.",
  model: "The AI did not answer. Try again.",
};

/** Asks the server for AI writing. Returns the new text, or throws an error with a message people can act on. */
export async function askAi(request: AiRequest): Promise<{ text: string; left: number }> {
  let response: Response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("No connection. Check your internet and try again.");
  }
  const body = (await response.json().catch(() => ({}))) as {
    text?: string;
    left?: number;
    error?: string;
  };
  if (!response.ok || !body.text)
    throw new Error(MESSAGES[body.error ?? "model"] ?? MESSAGES.model);
  return { text: body.text, left: body.left ?? 0 };
}
