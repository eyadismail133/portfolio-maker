"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { primaryButtonClass } from "@/editor/ui";
import { getMyAccount, type Account } from "@/lib/portfolios";
import {
  COMPARISON,
  formatPrice,
  MONTH_OPTIONS,
  MONTHLY_PRICE,
  priceFor,
  type Currency,
  type Months,
} from "@/lib/plans";

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
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
        <Link href="/" className="font-semibold">
          Portfolio Maker
        </Link>
        <Link href={account ? "/dashboard" : "/login"} className="ms-auto text-sm hover:underline">
          {account ? "My portfolios" : "Log in"}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Free to start. Pro when you need more.
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Pro is {formatPrice(MONTHLY_PRICE.EGP, "EGP")} or {formatPrice(MONTHLY_PRICE.USD, "USD")}{" "}
          a month, paid in advance for the months you choose. Nothing renews by itself.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <table className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <thead>
              <tr className="border-b border-zinc-200 text-start dark:border-zinc-800">
                <th scope="col" className="px-4 py-3 text-start font-medium text-zinc-500">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Free
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-semibold text-violet-700 dark:text-violet-300"
                >
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                >
                  <th
                    scope="row"
                    className="px-4 py-2.5 text-start font-normal text-zinc-600 dark:text-zinc-400"
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5">{row.free}</td>
                  <td className="px-4 py-2.5 font-medium">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-xl border border-violet-300 bg-white p-5 dark:border-violet-900 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{isPro ? "Add more Pro months" : "Get Pro"}</h2>
            {isPro && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {account?.proUntil
                  ? `You have Pro until ${when(account.proUntil)}. New months are added after that.`
                  : "You have Pro with no end date."}
              </p>
            )}

            {currencies.length > 1 && (
              <fieldset className="mt-4">
                <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Pay in
                </legend>
                <div className="mt-1.5 flex gap-2">
                  {currencies.map((c) => (
                    <label
                      key={c}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm has-checked:border-violet-600 has-checked:bg-violet-50 dark:border-zinc-700 dark:has-checked:bg-violet-950"
                    >
                      <input
                        type="radio"
                        name="currency"
                        checked={currency === c}
                        onChange={() => setCurrency(c)}
                      />
                      {c === "EGP" ? "Egyptian pounds" : "US dollars"}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="mt-4">
              <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                How many months
              </legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {MONTH_OPTIONS.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer flex-col rounded-md border border-zinc-300 px-3 py-2 text-sm has-checked:border-violet-600 has-checked:bg-violet-50 dark:border-zinc-700 dark:has-checked:bg-violet-950"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="months"
                        checked={months === m}
                        onChange={() => setMonths(m)}
                      />
                      <span className="font-medium">
                        {m} month{m > 1 ? "s" : ""}
                      </span>
                    </span>
                    <span className="ms-5 text-xs text-zinc-500">
                      {formatPrice(priceFor(m, currency), currency)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-5 flex items-baseline justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total</span>
              <span className="text-xl font-semibold">{formatPrice(total, currency)}</span>
            </p>

            {problem && (
              <p
                role="alert"
                className="mt-3 rounded-md border border-red-300 bg-red-50 p-2.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
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
              <p className="mt-4 rounded-md bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Payments open soon. Your work stays safe on the Free plan meanwhile.
              </p>
            ) : (
              <button
                type="button"
                disabled={busy || account === undefined}
                onClick={pay}
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
              >
                {busy ? "Opening Paymob…" : `Pay ${formatPrice(total, currency)} with Paymob`}
              </button>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Paymob takes cards, mobile wallets and kiosk payments. When your months end you go
              back to Free; nothing is deleted and published pages stay online.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
