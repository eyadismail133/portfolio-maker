/**
 * Shared settings for the load-test scripts. Every fake account uses an email in FAKE_DOMAIN with
 * the prefix FAKE_PREFIX, so cleanup can find all of them and nothing else.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export const FAKE_PREFIX = "loadtest-";
export const FAKE_DOMAIN = "loadtest.example.com";
export const DATA_FILE = "loadtest/.loadtest-data.json";

export const isFakeEmail = (email: string | undefined) =>
  Boolean(email && email.startsWith(FAKE_PREFIX) && email.endsWith(`@${FAKE_DOMAIN}`));

/** Reads .env.local without printing anything from it. */
export function readEnv(): Record<string, string> {
  const text = readFileSync(".env.local", "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

/** A client with the secret key: it skips row security, so it is used only by these scripts. */
export function adminClient() {
  const env = readEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local");
  return {
    url,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    db: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

/** Runs `work` over `items`, `limit` at a time. */
export async function inBatches<T>(
  items: T[],
  limit: number,
  work: (item: T, index: number) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += limit) {
    await Promise.all(items.slice(i, i + limit).map((item, j) => work(item, i + j)));
  }
}

/** Reads a number from the command line, like --accounts=200. */
export function option(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : fallback;
  if (!Number.isFinite(value) || value < 0) throw new Error(`--${name} must be a number`);
  return value;
}

export const flag = (name: string) => process.argv.includes(`--${name}`);
