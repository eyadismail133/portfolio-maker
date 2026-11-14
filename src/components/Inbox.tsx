"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass, UiIcon } from "@/editor/ui";
import { friendlyError, getMyAccount, listPortfolioNames, listPortfolios } from "@/lib/portfolios";
import {
  deleteMessage,
  deleteSignup,
  listMessages,
  listSignups,
  setMessageRead,
  signupsCsv,
  type Message,
  type Signup,
} from "@/lib/publishing";

/** Messages sent through the contact forms of the account's published portfolios. */
export function Inbox() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  /** Why no messages can arrive yet, worked out from the account's portfolios. */
  const [reason, setReason] = useState<{ text: string; editId?: string } | null>(null);

  /** Messages and sign-ups only: what marking, deleting and reloading can change. */
  const reload = useCallback(async () => {
    try {
      setMessages(await listMessages());
      setProblem("");
    } catch (error) {
      setMessages((current) => current ?? []);
      setProblem(friendlyError(error));
    }
    // Sign-ups need migration 0006; without it the inbox still shows messages.
    listSignups()
      .then(setSignups)
      .catch(() => setSignups([]));
  }, []);

  const refresh = useCallback(async () => {
    try {
      // Page names only; whole documents are read just when the inbox is empty, to explain why.
      const [list, names, account] = await Promise.all([
        listMessages(),
        listPortfolioNames(),
        getMyAccount(),
      ]);
      setPlan(account?.plan ?? null);
      setMessages(list);
      setTitles(Object.fromEntries(names.map((p) => [p.id, p.title])));
      const published = names.filter((p) => p.status === "published");
      const withoutForm =
        list.length === 0 && published.length > 0
          ? (await listPortfolios()).find(
              (p) =>
                p.status === "published" &&
                !p.doc?.sections.some(
                  (s) => s.type === "contact" && !s.hidden && s.variant === "form",
                ),
            )
          : undefined;
      setReason(
        published.length === 0
          ? {
              text: "No messages yet. Publish a portfolio with a Contact section and messages will arrive here.",
            }
          : withoutForm
            ? {
                text: "No messages yet. Your published page has no contact form, so visitors cannot write to you. Add a Contact section with the form layout, then update the live page.",
                editId: withoutForm.id,
              }
            : {
                text: "No messages yet. They will arrive here when visitors use your contact form.",
              },
      );
      setProblem("");
      // Sign-ups need migration 0006; without it the inbox still shows messages.
      listSignups()
        .then(setSignups)
        .catch(() => setSignups([]));
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
      await reload();
    } catch (error) {
      setProblem(friendlyError(error));
    }
  };

  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div aria-hidden="true" className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10" />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3.5">
          <Link
            href="/dashboard"
            className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            ← My portfolios
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-9">
        <div className="pm-animate-in">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Messages and sign-ups</h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Sent by visitors through the contact form on your published pages.
          </p>
        </div>
        {problem && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}
        {messages === null ? (
          <p className="mt-8 text-sm text-zinc-500">Loading messages…</p>
        ) : messages.length === 0 && !problem ? (
          <div className="pm-card pm-animate-in mt-8 rounded-2xl border-dashed px-6 py-14 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <span
              aria-hidden="true"
              className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400"
            >
              <UiIcon name="mail" size={20} />
            </span>
            <p>
              {reason?.text ??
                "No messages yet. Publish a portfolio with a Contact section and messages will arrive here."}
            </p>
            {reason?.editId && (
              <Link href={`/editor/${reason.editId}`} className={`${buttonClass} mt-3`}>
                Open the editor
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid gap-3.5">
            {messages.map((m, idx) =>
              m.locked && plan !== "pro" ? (
                <li
                  key={m.id}
                  style={{ animationDelay: `${Math.min(idx * 45, 250)}ms` }}
                  className="pm-animate-in pm-card rounded-2xl border-violet-300 bg-violet-50/80 p-5 text-sm dark:border-violet-900 dark:bg-violet-950/60"
                >
                  <p className="font-semibold">A new message is waiting</p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                    It arrived after this month&apos;s 50 free messages. Go Pro to read it and every
                    message after it.
                  </p>
                  <Link
                    href="/pro"
                    className="mt-3 inline-block font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
                  >
                    See Pro
                  </Link>
                </li>
              ) : (
                <li
                  key={m.id}
                  style={{ animationDelay: `${Math.min(idx * 45, 250)}ms` }}
                  className={`pm-animate-in pm-card rounded-2xl p-5 ${
                    m.isRead
                      ? "border-zinc-200/80 dark:border-zinc-800"
                      : "border-blue-400/80 ring-1 ring-blue-500/20 dark:border-blue-800"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold" dir="auto">
                      {!m.isRead && (
                        <span
                          className="me-2 inline-block size-2 rounded-full bg-blue-600 shadow-xs shadow-blue-600/50"
                          aria-label="New"
                        />
                      )}
                      {m.name}{" "}
                      <a
                        href={`mailto:${m.email}`}
                        dir="ltr"
                        className="font-normal text-blue-700 underline decoration-blue-700/40 underline-offset-2 dark:text-blue-400"
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
                  <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed" dir="auto">
                    {m.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
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
              ),
            )}
          </ul>
        )}
        {signups.length > 0 && (
          <Signups
            signups={signups}
            titles={titles}
            onDelete={(id) => act(() => deleteSignup(id))}
          />
        )}
      </main>
    </div>
  );
}

/** Newsletter sign-ups from pages whose newsletter section has no mailing list address. */
function Signups(props: {
  signups: Signup[];
  titles: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  const download = () => {
    const blob = new Blob(["\ufeff" + signupsCsv(props.signups, props.titles)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "newsletter-sign-ups.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="mt-12" aria-labelledby="signups-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="signups-heading" className="text-lg font-bold tracking-tight">
          Newsletter sign-ups{" "}
          <span className="text-sm font-normal text-zinc-500">({props.signups.length})</span>
        </h2>
        <button type="button" className={buttonClass} onClick={download}>
          Download as CSV
        </button>
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Addresses left in the newsletter section of your pages. Import the CSV into Mailchimp, Brevo
        or any mailing tool.
      </p>
      <ul className="pm-card mt-4 divide-y divide-zinc-200/80 overflow-hidden rounded-2xl dark:divide-zinc-800">
        {props.signups.slice(0, 100).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span dir="ltr" className="font-medium">
              {s.email}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(s.createdAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
              {props.titles[s.portfolioId] && ` · ${props.titles[s.portfolioId]}`}
            </span>
            <button
              type="button"
              className="ms-auto text-xs text-zinc-500 underline hover:text-red-700"
              onClick={() => props.onDelete(s.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {props.signups.length > 100 && (
        <p className="mt-2 text-xs text-zinc-500">
          {`Showing the newest 100. The CSV has all ${props.signups.length}.`}
        </p>
      )}
    </section>
  );
}
