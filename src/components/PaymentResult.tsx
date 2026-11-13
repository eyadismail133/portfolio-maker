"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryButtonClass, UiIcon } from "@/editor/ui";
import { getMyAccount } from "@/lib/portfolios";
import { createClient } from "@/lib/supabase/client";

type State =
  | { kind: "waiting" }
  | { kind: "paid"; until: string | null }
  | { kind: "failed" }
  | { kind: "unknown" };

/** After Paymob: waits for Paymob's confirmation to reach the server, then says what happened. */
export function PaymentResult() {
  const id = useSearchParams().get("payment") ?? "";
  const [state, setState] = useState<State>({ kind: "waiting" });

  useEffect(() => {
    let tries = 0;
    let timer = 0;
    const look = async () => {
      tries += 1;
      const { data } = await createClient()
        .from("payments")
        .select("status")
        .eq("id", id)
        .maybeSingle();
      const status = (data as { status?: string } | null)?.status;
      if (status === "paid") {
        const account = await getMyAccount();
        setState({ kind: "paid", until: account?.proUntil ?? null });
        return;
      }
      if (status === "failed") return setState({ kind: "failed" });
      if (!status && tries > 3) return setState({ kind: "unknown" });
      // Paymob usually confirms within seconds; keep looking for two minutes.
      if (tries < 60) timer = window.setTimeout(look, 2000);
      else setState({ kind: "unknown" });
    };
    void look();
    return () => window.clearTimeout(timer);
  }, [id]);

  const text = {
    waiting: [
      "Confirming your payment…",
      "This usually takes a few seconds. You can keep this page open.",
    ],
    paid: [
      "You are Pro now",
      state.kind === "paid" && state.until
        ? `Pro is yours until ${new Date(state.until).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.`
        : "Pro is switched on for your account.",
    ],
    failed: [
      "The payment did not go through",
      "No money was taken for Pro. You can try again with another card or wallet.",
    ],
    unknown: [
      "We have not heard from Paymob yet",
      "If money was taken, Pro switches on as soon as Paymob confirms. Check again in a few minutes.",
    ],
  }[state.kind];

  return (
    <main className="pm-aurora-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pm-card pm-animate-scale flex max-w-md flex-col items-center gap-4 rounded-3xl p-8">
        <span
          aria-hidden="true"
          className={`inline-flex size-12 items-center justify-center rounded-2xl ${
            state.kind === "paid"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : state.kind === "failed"
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-violet-500/15 text-violet-600 dark:text-violet-400"
          }`}
        >
          <UiIcon name={state.kind === "paid" ? "check" : "sparkles"} size={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight" role="status">
          {text[0]}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text[1]}</p>
        <div className="mt-2 flex gap-2.5">
          {state.kind === "failed" && (
            <Link href="/pro" className={primaryButtonClass}>
              Try again
            </Link>
          )}
          <Link
            href="/dashboard"
            className={
              state.kind === "failed"
                ? "rounded-lg px-3 py-1.5 text-sm font-medium underline underline-offset-2"
                : primaryButtonClass
            }
          >
            Go to my portfolios
          </Link>
        </div>
      </div>
    </main>
  );
}
