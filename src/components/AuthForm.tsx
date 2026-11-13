"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { BrandMark, buttonClass, inputClass, Label, primaryButtonClass, UiIcon } from "@/editor/ui";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/supabase/proxy";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  login: { title: "Log in", lead: "Welcome back. Your portfolios are waiting.", submit: "Log in" },
  signup: {
    title: "Create your account",
    lead: "Free to start. No card needed.",
    submit: "Create account",
  },
  forgot: {
    title: "Reset your password",
    lead: "Enter your email and we will send you a link to choose a new password.",
    submit: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    lead: "Use at least 8 characters.",
    submit: "Save new password",
  },
};

function explain(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "That email and password do not match. Check both and try again.";
  if (/email not confirmed/i.test(message))
    return "Confirm your email first: open the link we sent you, then log in.";
  if (/already registered|already been registered/i.test(message))
    return "This email already has an account. Log in instead.";
  if (/rate limit|too many/i.test(message)) return "Too many tries. Wait a minute, then try again.";
  if (/failed to fetch|network/i.test(message))
    return "No connection. Check your internet and try again.";
  if (/provider is not enabled/i.test(message))
    return "Google sign-in is not switched on for this site yet. Use email and password.";
  return message;
}

/** One form for the four account screens: log in, sign up, ask for a reset link, set a new password. */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    params.get("problem") === "link"
      ? "That link has expired or was already used. Ask for a new one."
      : "",
  );
  const [sent, setSent] = useState("");
  const copy = COPY[mode];
  const nextQuery = next === "/dashboard" ? "" : `?next=${encodeURIComponent(next)}`;

  const callbackUrl = (to: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl(next), data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else
          setSent(
            `We sent a link to ${email}. Open it to confirm your address and finish signing up.`,
          );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl("/reset-password"),
        });
        if (error) throw error;
        setSent(`If ${email} has an account, a reset link is on its way.`);
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (caught) {
      setError(
        explain(caught instanceof Error ? caught.message : "Something went wrong. Try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(next) },
      });
      if (error) throw error;
    } catch (caught) {
      setError(
        explain(
          caught instanceof Error ? caught.message : "Google sign-in did not start. Try again.",
        ),
      );
    }
  };

  return (
    <main className="pm-aurora-bg relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="pm-float pointer-events-none fixed -top-24 left-1/3 -z-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"
      />
      <div className="pm-card pm-animate-scale w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-2.5 text-sm font-semibold">
            <BrandMark size="sm" />
            <span>Portfolio Maker</span>
          </Link>
          <UiLanguageSwitch />
        </div>
        <h1 className="mt-7 text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{copy.lead}</p>

        {sent ? (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
          >
            {sent}
          </p>
        ) : (
          <>
            {(mode === "login" || mode === "signup") && (
              <>
                <button
                  type="button"
                  onClick={google}
                  className={`${buttonClass} mt-6 w-full py-2.5`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.57-5.17 3.57-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <div className="my-5 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"
                  />
                  <p className="text-center text-xs text-zinc-500">or with your email</p>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"
                  />
                </div>
              </>
            )}
            <form
              onSubmit={submit}
              className={`grid gap-4 ${mode === "forgot" || mode === "reset" ? "mt-6" : ""}`}
            >
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="auth-name">Your name</Label>
                  <input
                    id="auth-name"
                    className={inputClass}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              {mode !== "reset" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="auth-email">Email</Label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    dir="ltr"
                    autoComplete="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              {mode !== "forgot" && (
                <div className="grid gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="auth-password">
                      {mode === "reset" ? "New password" : "Password"}
                    </Label>
                    {mode === "login" && (
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-blue-700 underline decoration-blue-700/40 underline-offset-2 hover:decoration-blue-700 dark:text-blue-400"
                      >
                        Forgot it?
                      </Link>
                    )}
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={mode === "login" ? undefined : 8}
                    dir="ltr"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === "signup" && (
                    <p className="text-xs text-zinc-500">At least 8 characters.</p>
                  )}
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className={`${primaryButtonClass} mt-1 py-2.5 disabled:opacity-60`}
              >
                <span>{busy ? "One moment…" : copy.submit}</span>
                {!busy && <UiIcon name="arrowRight" size={15} className="rtl:rotate-180" />}
              </button>
              {mode === "signup" && (
                <p className="text-xs leading-relaxed text-zinc-500">
                  By creating an account you accept the{" "}
                  <Link href="/terms" className="underline underline-offset-2">
                    terms
                  </Link>{" "}
                  and the{" "}
                  <Link href="/privacy" className="underline underline-offset-2">
                    privacy policy
                  </Link>
                  .
                </p>
              )}
            </form>
          </>
        )}

        <p className="mt-6 border-t border-zinc-200/80 pt-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {mode === "login" && (
            <>
              New here?{" "}
              <Link
                href={`/signup${nextQuery}`}
                className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-400"
              >
                Create an account
              </Link>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${nextQuery}`}
                className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-400"
              >
                Log in
              </Link>
            </>
          )}
          {mode === "forgot" && (
            <Link
              href="/login"
              className="font-semibold text-blue-700 underline underline-offset-2 dark:text-blue-400"
            >
              Back to log in
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
