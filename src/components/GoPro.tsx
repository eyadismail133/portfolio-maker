"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { BrandMark, primaryButtonClass, UiIcon } from "@/editor/ui";
import {
  COMPARISON,
  formatPrice,
  MONTH_OPTIONS,
  MONTHLY_PRICE,
  priceFor,
  type Currency,
  type Months,
} from "@/lib/plans";
import { getMyAccount, type Account } from "@/lib/portfolios";

const ERRORS: Record<string, string> = {
  setup: "Payments are not switched on yet. Try again later.",
  login: "Log in first, then buy Pro.",
  provider: "Paymob did not start the payment. Try again in a minute.",
  database: "Something went wrong on our side. Try again.",
  invalid: "Choose how many months, then try again.",
};

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Plans side by side, then a choice of months and currency, then off to Paymob. */
export function GoPro({ currencies }: { currencies: Currency[] }) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [months, setMonths] = useState<Months>(1);
  const [currency, setCurrency] = useState<Currency>(currencies[0] ?? "EGP");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    getMyAccount()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);

  const pay = async () => {
    setBusy(true);
    setProblem("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ months, currency }),
      });
      const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !body.url)
        throw new Error(ERRORS[body.error ?? "provider"] ?? ERRORS.provider);
      window.location.assign(body.url);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : ERRORS.provider);
      setBusy(false);
    }
  };

  const isPro = account?.plan === "pro";
  const total = priceFor(months, currency);

  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div aria-hidden="true" className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10" />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="group inline-flex items-center gap-2.5 font-semibold">
            <BrandMark size="sm" />
            <span className="hidden sm:inline">Portfolio Maker</span>
          </Link>
          <UiLanguageSwitch className="ms-auto" />
          <Link
            href={account ? "/dashboard" : "/login"}
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            {account ? "My portfolios" : "Log in"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <div className="pm-animate-in">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Free to start. Pro when you need more.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {`Pro is ${formatPrice(MONTHLY_PRICE.EGP, "EGP")} or ${formatPrice(MONTHLY_PRICE.USD, "USD")} a month, paid in advance for the months you choose. Nothing renews by itself.`}
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="pm-card pm-animate-in pm-stagger-1 overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-start dark:border-zinc-800 dark:bg-zinc-900/60">
                  <th scope="col" className="px-5 py-3.5 text-start font-medium text-zinc-500">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-start font-semibold">
                    Free
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-start font-bold text-violet-700 dark:text-violet-300"
                  >
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/60 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                  >
                    <th
                      scope="row"
                      className="px-5 py-3 text-start font-normal text-zinc-600 dark:text-zinc-400"
                    >
                      {row.label}
                    </th>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">{row.free}</td>
                    <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-white">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pm-card pm-animate-in pm-stagger-2 relative overflow-hidden rounded-2xl border-violet-300/90 p-6 ring-1 ring-violet-500/20 dark:border-violet-900/80">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/15 blur-2xl"
            />
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-violet-600/15 text-violet-600 dark:text-violet-400">
                <UiIcon name="sparkles" size={16} />
              </span>
              <h2 className="text-lg font-bold tracking-tight">
                {isPro ? "Add more Pro months" : "Get Pro"}
              </h2>
            </div>
            {isPro && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {account?.proUntil
                  ? `You have Pro until ${when(account.proUntil)}. New months are added after that.`
                  : "You have Pro with no end date."}
              </p>
            )}

            {currencies.length > 1 && (
              <fieldset className="mt-5">
                <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Pay in
                </legend>
                <div className="mt-2 flex gap-2">
                  {currencies.map((c) => (
                    <label
                      key={c}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300/90 px-3 py-2 text-sm font-medium transition-all has-checked:border-violet-600 has-checked:bg-violet-50/90 has-checked:text-violet-950 has-checked:ring-1 has-checked:ring-violet-600 dark:border-zinc-700 dark:has-checked:bg-violet-950/70 dark:has-checked:text-violet-100"
                    >
                      <input
                        type="radio"
                        name="currency"
                        className="accent-violet-600"
                        checked={currency === c}
                        onChange={() => setCurrency(c)}
                      />
                      {c === "EGP" ? "Egyptian pounds" : "US dollars"}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="mt-5">
              <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                How many months
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                {MONTH_OPTIONS.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer flex-col rounded-xl border border-zinc-300/90 px-3.5 py-2.5 text-sm transition-all hover:border-zinc-400 has-checked:border-violet-600 has-checked:bg-violet-50/90 has-checked:ring-1 has-checked:ring-violet-600 dark:border-zinc-700 dark:hover:border-zinc-600 dark:has-checked:bg-violet-950/70"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="months"
                        className="accent-violet-600"
                        checked={months === m}
                        onChange={() => setMonths(m)}
                      />
                      <span className="font-semibold">{`${m} month${m > 1 ? "s" : ""}`}</span>
                    </span>
                    <span className="ms-5 mt-0.5 text-xs text-zinc-500">
                      {formatPrice(priceFor(m, currency), currency)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-6 flex items-baseline justify-between border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total</span>
              <span className="text-2xl font-bold tracking-tight">
                {formatPrice(total, currency)}
              </span>
            </p>

            {problem && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
              >
                {problem}
              </p>
            )}

            {account === null ? (
              <Link
                href="/signup?next=%2Fpro"
                className={`${primaryButtonClass} mt-4 w-full py-2.5`}
              >
                Create an account to buy Pro
              </Link>
            ) : currencies.length === 0 ? (
              <p className="mt-4 rounded-xl bg-zinc-100 p-3.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Payments open soon. Your work stays safe on the Free plan meanwhile.
              </p>
            ) : (
              <button
                type="button"
                disabled={busy || account === undefined}
                onClick={pay}
                className="pm-btn-pro mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
              >
                <span>
                  {busy ? "Opening Paymob…" : `Pay ${formatPrice(total, currency)} with Paymob`}
                </span>
                {!busy && <UiIcon name="arrowRight" size={15} className="rtl:rotate-180" />}
              </button>
            )}
            <p className="mt-3.5 text-xs leading-relaxed text-zinc-500">
              Paymob takes cards, mobile wallets and kiosk payments. When your months end you go
              back to Free; nothing is deleted and published pages stay online. See the{" "}
              <Link href="/refunds" className="underline underline-offset-2">
                refund policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
