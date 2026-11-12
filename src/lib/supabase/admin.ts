import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * A Supabase client with full access, for trusted server code only (payment webhooks).
 * It bypasses row security, so never import it from a page or a component.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
