"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { BrandMark, buttonClass, inputClass, Label, primaryButtonClass, UiIcon } from "@/editor/ui";
import { clearDraft, clearPending, readDraft, readPending } from "@/lib/local-drafts";
import { addStoredPicture } from "@/lib/picture-store";
import {
  createPortfolio,
  deletePortfolio,
  duplicatePortfolio,
  friendlyError,
  getMyAccount,
  listPortfolios,
  renamePortfolio,
  saveOnboardingAnswers,
  type Account,
  type PortfolioSummary,
} from "@/lib/portfolios";
import { listMessages, viewCounts } from "@/lib/publishing";
import { createClient } from "@/lib/supabase/client";
import { MiniPreview } from "./MiniPreview";

function when(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DialogState =
  | { kind: "rename"; item: PortfolioSummary; title: string }
  | { kind: "delete"; item: PortfolioSummary };

/** The signed-in home: every portfolio of the account, with open, rename, duplicate and delete. */
export function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioSummary[] | null>(null);
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [unread, setUnread] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);
  const plan = account?.plan ?? null;
  const dialogRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await listPortfolios());
      setProblem("");
    } catch (error) {
      setProblem(friendlyError(error));
      setItems((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (cancelled) return;
      setEmail(data.user?.email ?? "");
      // A portfolio chosen before logging in is saved to the account now and opened.
      const pending = readPending();
      if (pending) {
        try {
          const doc = await addStoredPicture(pending.doc);
          const id = await createPortfolio(doc, pending.title || pending.doc.meta.title);
          if (pending.answers) await saveOnboardingAnswers(pending.answers, id);
          clearPending();
          router.replace(`/editor/${id}`);
          return;
        } catch (error) {
          if (!cancelled) setProblem(friendlyError(error));
        }
      }
      if (cancelled) return;
      setHasDraft(readDraft() !== null);
      await refresh();
      // Extras: if these tables are not set up yet, the dashboard still works without them.
      viewCounts()
        .then((counts) => !cancelled && setViews(counts))
        .catch(() => undefined);
      getMyAccount()
        .then((found) => !cancelled && setAccount(found))
        .catch(() => undefined);
      listMessages()
        .then((messages) => !cancelled && setUnread(messages.filter((m) => !m.isRead).length))
        .catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  useEffect(() => {
    if (dialog) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [dialog]);

  /** Runs one action, shows what went wrong if it fails, then reloads the list. */
  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    setProblem("");
    try {
      await action();
      await refresh();
    } catch (error) {
      setProblem(friendlyError(error));
    } finally {
      setBusy("");
    }
  };

  const importDraft = () =>
    run("draft", async () => {
      const draft = readDraft();
      if (!draft) return;
      const id = await createPortfolio(draft, draft.meta.title);
      clearDraft();
      setHasDraft(false);
      router.push(`/editor/${id}`);
    });

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="pm-aurora-bg flex min-h-dvh flex-col bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden="true"
        className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10"
      />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <Link href="/" className="group inline-flex items-center gap-2.5 text-sm font-semibold">
            <BrandMark size="sm" />
            <span>Portfolio Maker</span>
          </Link>
          <span className="ms-auto truncate text-xs text-zinc-500 sm:text-sm" dir="ltr">
            {email}
          </span>
          {plan && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                plan === "pro"
                  ? "bg-gradient-to-r from-violet-600/15 to-indigo-600/15 text-violet-800 ring-1 ring-violet-500/30 dark:from-violet-500/20 dark:to-indigo-500/20 dark:text-violet-200"
                  : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
              }`}
            >
              {plan === "pro"
                ? account?.proUntil
                  ? `Pro until ${new Date(account.proUntil).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
                  : "Pro"
                : "Free plan"}
            </span>
          )}
          <Link
            href="/pro"
            className="inline-flex items-center gap-1 rounded-lg bg-violet-50/90 px-3 py-1.5 text-sm font-semibold text-violet-700 ring-1 ring-violet-200/80 transition-all hover:-translate-y-0.5 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800/70 dark:hover:bg-violet-900/60"
          >
            <UiIcon name="sparkles" size={14} />
            <span>{plan === "pro" ? "Add Pro months" : "Go Pro"}</span>
          </Link>
          <Link
            href="/account"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Account
          </Link>
          <UiLanguageSwitch />
          <button type="button" className={buttonClass} onClick={signOut}>
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-9">
        <div className="pm-animate-in flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My portfolios</h1>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/dashboard/inbox" className={`${buttonClass} px-4 py-2`}>
              <UiIcon name="mail" size={15} />
              <span>Messages{unread > 0 ? ` (${unread} new)` : ""}</span>
            </Link>
            <Link href="/new" className={`${primaryButtonClass} px-4 py-2`}>
              <UiIcon name="plus" size={15} />
              <span>New portfolio</span>
            </Link>
          </div>
        </div>

        {problem && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
          >
            {problem}
          </p>
        )}

        {hasDraft && (
          <div className="pm-card mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-blue-200 bg-blue-50/80 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/60">
            <span>You have a draft in this browser from before you logged in.</span>
            <button
              type="button"
              className={buttonClass}
              disabled={busy === "draft"}
              onClick={importDraft}
            >
              {busy === "draft" ? "Adding…" : "Add it to my portfolios"}
            </button>
          </div>
        )}

        {items === null ? (
          <p className="mt-10 text-sm text-zinc-500">Loading your portfolios…</p>
        ) : items.length === 0 && !problem ? (
          <div className="pm-card pm-animate-in mt-10 rounded-3xl border-dashed px-6 py-16 text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/15 to-indigo-600/15 text-blue-600 dark:text-blue-400"
            >
              <UiIcon name="layers" size={24} />
            </span>
            <h2 className="text-lg font-bold tracking-tight">Create your first portfolio</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Answer eight short questions and pick one of six starting designs. It takes about two
              minutes.
            </p>
            <Link href="/new" className={`${primaryButtonClass} mt-6 px-6 py-2.5`}>
              <span>Start</span>
              <UiIcon name="arrowRight" size={15} className="rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <ul className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => (
              <li
                key={item.id}
                style={{ animationDelay: `${Math.min(idx * 55, 330)}ms` }}
                className="pm-animate-in pm-card-interactive group flex flex-col overflow-hidden rounded-2xl p-2"
              >
                <div aria-hidden="true" className="mb-2 flex items-center gap-1.5 px-2 pt-1">
                  <span className="size-2 rounded-full bg-rose-400/80" />
                  <span className="size-2 rounded-full bg-amber-400/80" />
                  <span className="size-2 rounded-full bg-emerald-400/80" />
                </div>
                <Link
                  href={`/editor/${item.id}`}
                  aria-label={`Open ${item.title}`}
                  className="block overflow-hidden rounded-xl border border-zinc-200/80 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-800"
                >
                  {item.doc ? (
                    <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      <MiniPreview doc={item.doc} />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/11] items-center justify-center p-4 text-center text-xs text-zinc-500">
                      This portfolio was saved by a newer version and cannot be shown here.
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-3.5 pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate text-sm font-semibold tracking-tight" dir="auto">
                      {item.title}
                    </h2>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.status === "published"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${item.status === "published" ? "bg-emerald-500" : "bg-zinc-400"}`}
                      />
                      <span>{item.status === "published" ? "Published" : "Draft"}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Edited {when(item.updatedAt)}
                    {item.status === "published" && ` · ${views[item.id] ?? 0} visits in 30 days`}
                  </p>
                  {item.status === "published" && item.slug && (
                    <a
                      href={`/p/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="mt-1.5 inline-flex items-center gap-1 truncate text-xs font-medium text-blue-700 underline decoration-blue-700/40 underline-offset-2 hover:decoration-blue-700 dark:text-blue-400"
                    >
                      <span>/p/{item.slug}</span>
                      <UiIcon name="external" size={11} />
                    </a>
                  )}
                  <div className="mt-3.5 flex flex-wrap gap-1.5 pt-1">
                    <Link href={`/editor/${item.id}`} className={primaryButtonClass}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => setDialog({ kind: "rename", item, title: item.title })}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={busy === item.id || !item.doc}
                      onClick={() => run(item.id, () => duplicatePortfolio(item))}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => setDialog({ kind: "delete", item })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <dialog
        ref={dialogRef}
        onClose={() => setDialog(null)}
        aria-labelledby="dashboard-dialog-title"
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {dialog?.kind === "rename" && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const { item, title } = dialog;
              setDialog(null);
              void run(item.id, () => renamePortfolio(item.id, title));
            }}
          >
            <h2 id="dashboard-dialog-title" className="text-base font-semibold">
              Rename portfolio
            </h2>
            <div className="grid gap-1.5">
              <Label htmlFor="rename-title">Name</Label>
              <input
                id="rename-title"
                className={inputClass}
                dir="auto"
                maxLength={120}
                required
                value={dialog.title}
                onChange={(e) => setDialog({ ...dialog, title: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass} onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button type="submit" className={primaryButtonClass}>
                Save name
              </button>
            </div>
          </form>
        )}
        {dialog?.kind === "delete" && (
          <div className="grid gap-4">
            <h2 id="dashboard-dialog-title" className="text-base font-semibold">
              {`Delete “${dialog.item.title}”?`}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              The portfolio and its published page are removed for good. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className={buttonClass} onClick={() => setDialog(null)}>
                Keep it
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-xs transition-all hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => {
                  const { item } = dialog;
                  setDialog(null);
                  void run(item.id, () => deletePortfolio(item.id));
                }}
              >
                Delete portfolio
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
