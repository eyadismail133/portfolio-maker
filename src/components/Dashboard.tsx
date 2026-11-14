"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { spring, staggerDelay } from "@/lib/motion";
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
import { publishChecks } from "@/lib/publish-checks";
import { unreadMessageCount, viewCounts } from "@/lib/publishing";
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

/** True when the document holds an image the owner uploaded (the samples have none). */
function hasImage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasImage);
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.assetId === "string" && typeof record.url === "string") return true;
  return Object.values(record).some(hasImage);
}

const CHECKLIST_KEY = "pm-checklist-hidden";

/** First steps for a new account. Each one ticks itself from the account's real state. */
function GettingStarted(props: { items: PortfolioSummary[]; views: Record<string, number> }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(CHECKLIST_KEY) === "1";
    } catch {
      stored = false;
    }
    Promise.resolve().then(() => setHidden(stored));
  }, []);
  const main =
    props.items.find((item) => item.status === "published" && item.doc) ??
    props.items.find((item) => item.doc);
  if (!main?.doc || hidden) return null;
  const live = props.items.find((item) => item.status === "published" && item.slug);
  const visited = props.items.some((item) => (props.views[item.id] ?? 0) > 0);
  const steps = [
    {
      label: "Replace the sample text with your own",
      done: !publishChecks(main.doc).some((check) => check.id === "sample-text"),
      href: `/editor/${main.id}`,
    },
    { label: "Add your photo or logo", done: hasImage(main.doc), href: `/editor/${main.id}` },
    { label: "Publish your page", done: Boolean(live), href: `/editor/${main.id}` },
    {
      label: "Share your link and get your first visit",
      done: visited,
      href: live ? `/p/${live.slug}` : `/editor/${main.id}`,
    },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  if (doneCount === steps.length) return null;
  const hide = () => {
    try {
      window.localStorage.setItem(CHECKLIST_KEY, "1");
    } catch {
      // Hidden for this visit only.
    }
    setHidden(true);
  };
  return (
    <section
      aria-labelledby="getting-started"
      className="pm-card pm-animate-in mt-6 rounded-2xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="getting-started" className="text-base font-bold tracking-tight">
            Getting started
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">{`${doneCount} of ${steps.length} done`}</p>
        </div>
        <button type="button" className={`${buttonClass} px-2.5 py-1 text-xs`} onClick={hide}>
          Hide
        </button>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800"
        aria-hidden="true"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
          initial={{ width: 0 }}
          animate={{ width: `${(doneCount / steps.length) * 100}%` }}
          transition={spring.soft}
        />
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              target={step.href.startsWith("/p/") ? "_blank" : undefined}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                step.done
                  ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-zinc-200/80 bg-white/70 hover:border-blue-300 hover:bg-blue-50/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/40"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {step.done ? "✓" : ""}
              </span>
              <span className={step.done ? "line-through decoration-emerald-500/60" : ""}>
                {step.label}
              </span>
              <span className="sr-only">{step.done ? "Done" : "Not done yet"}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Rename, duplicate and delete for one card, behind a "…" button. */
function CardMenu(props: {
  title: string;
  disabled: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const item =
    "w-full rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800";
  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <span className="relative">
      <button
        type="button"
        className={`${buttonClass} px-2.5`}
        aria-label={`More actions for ${props.title}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" className="text-base leading-none tracking-widest">
          …
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close the menu"
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <span
            id={menuId}
            className="pm-animate-scale absolute bottom-full end-0 z-40 mb-1.5 grid w-40 gap-0.5 rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button type="button" className={item} onClick={choose(props.onRename)}>
              Rename
            </button>
            <button
              type="button"
              className={item}
              disabled={props.disabled}
              onClick={choose(props.onDuplicate)}
            >
              Duplicate
            </button>
            <button
              type="button"
              className={`${item} text-red-700 dark:text-red-400`}
              onClick={choose(props.onDelete)}
            >
              Delete
            </button>
          </span>
        </>
      )}
    </span>
  );
}

type DialogState =
  | { kind: "rename"; item: PortfolioSummary; title: string }
  | { kind: "delete"; item: PortfolioSummary };

/** The signed-in home: every portfolio of the account, with open, rename, duplicate and delete. */
export function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioSummary[] | null>(null);
  // Cards arrive one after another only when the page first loads, not after every change.
  const [settled, setSettled] = useState(false);
  const loaded = items !== null;
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => setSettled(true), 900);
    return () => window.clearTimeout(timer);
  }, [loaded]);
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [unread, setUnread] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
      unreadMessageCount()
        .then((count) => !cancelled && setUnread(count))
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
      <div aria-hidden="true" className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10" />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <Link href="/" className="group inline-flex items-center gap-2.5 text-sm font-semibold">
            <BrandMark size="sm" />
            <span className="hidden sm:inline">Portfolio Maker</span>
          </Link>
          <span
            className="ms-auto hidden truncate text-xs text-zinc-500 sm:inline sm:text-sm"
            dir="ltr"
          >
            {email}
          </span>
          {plan && (
            <span
              className={`ms-auto sm:ms-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
          <span className="hidden items-center gap-3 sm:flex">
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
          </span>
          <button
            type="button"
            className={`${buttonClass} px-2.5 sm:hidden`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="dashboard-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="grid gap-[3px]">
              <span className="block h-0.5 w-4 rounded bg-current" />
              <span className="block h-0.5 w-4 rounded bg-current" />
              <span className="block h-0.5 w-4 rounded bg-current" />
            </span>
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="dashboard-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-zinc-200/80 sm:hidden dark:border-zinc-800"
            >
              <div className="grid gap-1 px-5 py-3">
                <span className="truncate px-2.5 py-1 text-xs text-zinc-500" dir="ltr">
                  {email}
                </span>
                <Link
                  href="/account"
                  className="rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                >
                  Account
                </Link>
                <span className="px-2.5 py-1">
                  <UiLanguageSwitch />
                </span>
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-2 text-start text-sm font-medium hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                  onClick={signOut}
                >
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

        {items && items.length > 0 && <GettingStarted items={items} views={views} />}

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
          <motion.ul layout className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Cards make room for a copy and close the gap after a delete instead of jumping. */}
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item, idx) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                  transition={{ ...spring.layout, delay: settled ? 0 : staggerDelay(idx, 0.055) }}
                  className="pm-card-interactive group flex flex-col overflow-hidden rounded-2xl p-2"
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
                    <div className="mt-auto flex items-center gap-1.5 pt-4">
                      <Link
                        href={`/editor/${item.id}`}
                        className={`${primaryButtonClass} flex-1 justify-center`}
                      >
                        Edit
                      </Link>
                      <CardMenu
                        title={item.title}
                        disabled={busy === item.id || !item.doc}
                        onRename={() => setDialog({ kind: "rename", item, title: item.title })}
                        onDuplicate={() => run(item.id, () => duplicatePortfolio(item))}
                        onDelete={() => setDialog({ kind: "delete", item })}
                      />
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
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
