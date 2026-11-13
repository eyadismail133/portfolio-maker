"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { buttonClass, inputClass, Label, primaryButtonClass } from "@/editor/ui";
import { formatPrice, LIMITS, PLAN_NAMES } from "@/lib/plans";
import { friendlyError, getMyAccount, type Account } from "@/lib/portfolios";
import { listPayments, type PaymentRecord } from "@/lib/publishing";
import { createClient } from "@/lib/supabase/client";
import { storageUsed } from "@/lib/upload";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const mb = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pm-card pm-animate-in rounded-2xl p-6">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Message({ text, error }: { text: string; error?: boolean }) {
  if (!text) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-3 text-sm font-medium ${error ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
    >
      {text}
    </p>
  );
}

/** Name, password, plan, payments, storage, and deleting the account. */
export function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [nameNote, setNameNote] = useState({ text: "", error: false });
  const [password, setPassword] = useState("");
  const [passwordNote, setPasswordNote] = useState({ text: "", error: false });
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [used, setUsed] = useState<number | null>(null);
  const [confirm, setConfirm] = useState("");
  const [deleteNote, setDeleteNote] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const found = await getMyAccount();
      setAccount(found);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", auth.user.id)
          .maybeSingle();
        setName((data as { name?: string } | null)?.name ?? "");
      }
      listPayments()
        .then(setPayments)
        .catch(() => setPayments([]));
      storageUsed()
        .then(setUsed)
        .catch(() => setUsed(null));
    })();
  }, []);

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("name");
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim().slice(0, 120) })
        .eq("id", auth.user!.id);
      if (error) throw error;
      setNameNote({ text: "Name saved.", error: false });
    } catch (error) {
      setNameNote({ text: friendlyError(error), error: true });
    } finally {
      setBusy("");
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("password");
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setPasswordNote({ text: "Password changed.", error: false });
    } catch (error) {
      setPasswordNote({ text: friendlyError(error), error: true });
    } finally {
      setBusy("");
    }
  };

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("delete");
    setDeleteNote("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      if (!response.ok) throw new Error();
      await createClient().auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setDeleteNote("The account could not be deleted. Try again, or write to us.");
      setBusy("");
    }
  };

  const plan = account?.plan ?? "free";
  const limit = LIMITS.storageBytes[plan];

  return (
    <div className="pm-aurora-bg min-h-dvh bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden="true"
        className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10"
      />
      <header className="pm-glass-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3.5">
          <Link
            href="/dashboard"
            className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            ← My portfolios
          </Link>
          <UiLanguageSwitch className="ms-auto" />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-2xl gap-5 px-5 py-9">
        <h1 className="pm-animate-in text-2xl font-bold tracking-tight sm:text-3xl">Account</h1>

        <Card title="Plan">
          <p className="text-sm">
            <span className="font-semibold">{PLAN_NAMES[plan]}</span>
            {plan === "pro" &&
              (account?.proUntil ? ` until ${date(account.proUntil)}` : ", no end date")}
          </p>
          {used !== null && (
            <div className="mt-3.5">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {`Images: ${mb(used)} of ${mb(limit)}`}
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <Link href="/pro" className={`${primaryButtonClass} mt-4`}>
            {plan === "pro" ? "Add Pro months" : "Go Pro"}
          </Link>
          <h3 className="mt-6 text-sm font-semibold">Payments</h3>
          {payments === null ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : payments.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No payments yet.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-start text-xs text-zinc-500">
                  <th className="py-1.5 text-start font-medium">Date</th>
                  <th className="py-1.5 text-start font-medium">Pro</th>
                  <th className="py-1.5 text-start font-medium">Amount</th>
                  <th className="py-1.5 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-2">{date(p.paidAt ?? p.createdAt)}</td>
                    <td className="py-2">
                      {p.months} month{p.months > 1 ? "s" : ""}
                    </td>
                    <td className="py-2">{formatPrice(p.amountCents, p.currency)}</td>
                    <td className="py-2">
                      {p.status === "paid" ? (
                        <Link
                          href={`/account/receipt/${p.id}`}
                          className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
                        >
                          Paid · receipt
                        </Link>
                      ) : p.status === "failed" ? (
                        "Not completed"
                      ) : (
                        "Waiting"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Your details">
          <form onSubmit={saveName} className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor="account-email">Email</Label>
              <input
                id="account-email"
                className={`${inputClass} bg-zinc-50 dark:bg-zinc-800/80`}
                dir="ltr"
                readOnly
                value={account?.email ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="account-name">Name</Label>
              <input
                id="account-name"
                className={inputClass}
                dir="auto"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={busy === "name"}
              className={`${buttonClass} justify-self-start`}
            >
              Save name
            </button>
          </form>
          <Message {...nameNote} />
        </Card>

        <Card title="Password">
          <form onSubmit={savePassword} className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor="account-password">New password</Label>
              <input
                id="account-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                dir="ltr"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-zinc-500">At least 8 characters.</p>
            </div>
            <button
              type="submit"
              disabled={busy === "password"}
              className={`${buttonClass} justify-self-start`}
            >
              Change password
            </button>
          </form>
          <Message {...passwordNote} />
        </Card>

        <Card title="Delete account">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Deletes your account, every portfolio, published page, message and uploaded image. This
            cannot be undone.
          </p>
          <form onSubmit={deleteAccount} className="mt-4 grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor="account-delete">
                Type <strong data-no-translate>delete</strong> to confirm
              </Label>
              <input
                id="account-delete"
                className={inputClass}
                dir="ltr"
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={confirm !== "delete" || busy === "delete"}
              className="inline-flex items-center justify-self-start rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition-all hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
            >
              {busy === "delete" ? "Deleting…" : "Delete my account"}
            </button>
          </form>
          {deleteNote && <Message text={deleteNote} error />}
        </Card>
      </main>
    </div>
  );
}
