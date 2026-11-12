"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/editor/ui";
import { friendlyError, listPortfolios } from "@/lib/portfolios";
import { deleteMessage, listMessages, setMessageRead, type Message } from "@/lib/publishing";

/** Messages sent through the contact forms of the account's published portfolios. */
export function Inbox() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [list, portfolios] = await Promise.all([listMessages(), listPortfolios()]);
      setMessages(list);
      setTitles(Object.fromEntries(portfolios.map((p) => [p.id, p.title])));
      setProblem("");
    } catch (error) {
      setMessages((current) => current ?? []);
      setProblem(friendlyError(error));
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(refresh);
  }, [refresh]);

  const act = async (action: () => Promise<void>) => {
    try {
      await action();
      await refresh();
    } catch (error) {
      setProblem(friendlyError(error));
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/dashboard" className="text-sm font-semibold">
          ← My portfolios
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sent by visitors through the contact form on your published pages.
        </p>
        {problem && (
          <p
            role="alert"
            className="mt-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}
        {messages === null ? (
          <p className="mt-8 text-sm text-zinc-500">Loading messages…</p>
        ) : messages.length === 0 && !problem ? (
          <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No messages yet. Publish a portfolio with a Contact section and messages will arrive
            here.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${m.isRead ? "border-zinc-200 dark:border-zinc-800" : "border-blue-300 dark:border-blue-800"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold" dir="auto">
                    {!m.isRead && (
                      <span
                        className="me-2 inline-block size-2 rounded-full bg-blue-600"
                        aria-label="New"
                      />
                    )}
                    {m.name}{" "}
                    <a
                      href={`mailto:${m.email}`}
                      dir="ltr"
                      className="font-normal text-blue-700 underline dark:text-blue-400"
                    >
                      {m.email}
                    </a>
                  </p>
                  <span className="text-xs text-zinc-500">
                    {new Date(m.createdAt).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {titles[m.portfolioId] && ` · ${titles[m.portfolioId]}`}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm" dir="auto">
                  {m.message}
                </p>
                <div className="mt-3 flex gap-2">
                  <a href={`mailto:${m.email}`} className={buttonClass}>
                    Reply by email
                  </a>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => act(() => setMessageRead(m.id, !m.isRead))}
                  >
                    {m.isRead ? "Mark as new" : "Mark as read"}
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => act(() => deleteMessage(m.id))}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
