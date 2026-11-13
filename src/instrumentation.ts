import type { Instrumentation } from "next";

/**
 * Server errors go to the `error_log` table (migration 0006) when the server key is set, so the
 * owner can read them in Supabase. Only the message, digest, path and kind are kept: no request
 * bodies, cookies or personal data.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.SUPABASE_SECRET_KEY || process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const problem = error as { message?: string; digest?: string };
    await createAdminClient()
      .from("error_log")
      .insert({
        message: String(problem.message ?? error).slice(0, 2000),
        digest: String(problem.digest ?? "").slice(0, 200),
        path: request.path.split("?")[0].slice(0, 500),
        kind: `${context.routeType}:${context.routerKind}`.slice(0, 50),
      });
  } catch {
    // Logging must never cause a second error.
  }
};
