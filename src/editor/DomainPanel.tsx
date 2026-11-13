"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass, inputClass, Label } from "./ui";

type State = {
  domain: string | null;
  ready?: boolean;
  records?: { type: string; name: string; value: string }[];
  enabled: boolean;
};

/** Connect a domain you own to a published page (Pro). */
export function DomainPanel({ portfolioId, isPro }: { portfolioId: string; isPro: boolean }) {
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/domains?portfolioId=${encodeURIComponent(portfolioId)}`);
      if (response.ok) setState((await response.json()) as State);
    } catch {
      // Without a connection the panel stays hidden.
    }
  }, [portfolioId]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const send = async (method: "POST" | "DELETE") => {
    setBusy(true);
    setProblem("");
    try {
      const response = await fetch(
        method === "POST"
          ? "/api/domains"
          : `/api/domains?portfolioId=${encodeURIComponent(portfolioId)}`,
        method === "POST"
          ? {
              method,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ portfolioId, domain: input }),
            }
          : { method },
      );
      const body = (await response.json().catch(() => ({}))) as State & { error?: string };
      if (!response.ok) setProblem(body.error ?? "Something went wrong. Try again.");
      else if (method === "DELETE") setState({ domain: null, enabled: state?.enabled ?? true });
      else setState(body);
    } catch {
      setProblem("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!state || (!state.enabled && !state.domain)) return null;

  return (
    <div className="grid gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-semibold">Your own domain</p>
      {!isPro && !state.domain ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Show this page on a domain you own, like yourname.com. Part of Pro.{" "}
          <Link href="/pro" className="font-medium underline">
            See Pro
          </Link>
        </p>
      ) : state.domain ? (
        <>
          <p className="text-sm" dir="ltr">
            <span className="font-medium">{state.domain}</span>{" "}
            <span className={state.ready ? "text-emerald-700" : "text-amber-700"}>
              {state.ready ? "· working" : "· waiting for DNS"}
            </span>
          </p>
          {!state.ready && state.records && state.records.length > 0 && (
            <div className="text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">
                At the company where you bought the domain, add these DNS records. It can take from
                a few minutes to a day to work.
              </p>
              <table className="mt-2 w-full text-xs" dir="ltr">
                <thead>
                  <tr className="text-start text-zinc-500">
                    <th className="py-1 text-start font-medium">Type</th>
                    <th className="py-1 text-start font-medium">Name</th>
                    <th className="py-1 text-start font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {state.records.map((r) => (
                    <tr
                      key={`${r.type}${r.name}${r.value}`}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-1 pe-2 font-mono">{r.type}</td>
                      <td className="py-1 pe-2 font-mono">{r.name}</td>
                      <td className="break-all py-1 font-mono">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2">
            {!state.ready && (
              <button type="button" className={buttonClass} disabled={busy} onClick={load}>
                Check again
              </button>
            )}
            <button
              type="button"
              className={buttonClass}
              disabled={busy}
              onClick={() => send("DELETE")}
            >
              Remove the domain
            </button>
          </div>
        </>
      ) : (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send("POST");
          }}
        >
          <Label htmlFor="custom-domain">Domain</Label>
          <div className="flex gap-2">
            <input
              id="custom-domain"
              dir="ltr"
              className={inputClass}
              placeholder="portfolio.example.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={buttonClass} disabled={busy || !input.trim()}>
              {busy ? "Connecting…" : "Connect"}
            </button>
          </div>
        </form>
      )}
      {problem && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {problem}
        </p>
      )}
    </div>
  );
}
