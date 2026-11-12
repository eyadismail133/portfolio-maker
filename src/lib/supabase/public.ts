import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * A Supabase client with no login, for reading published pages on the server. It never touches
 * cookies, so its results can be cached and shared between visitors.
 */
export function createPublicClient() {
  const { url, key } = getSupabaseEnv();
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
