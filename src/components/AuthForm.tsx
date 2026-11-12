"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass, inputClass, Label, primaryButtonClass } from "@/editor/ui";
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
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm font-semibold">
          Portfolio Maker
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{copy.lead}</p>

        {sent ? (
          <p
            role="status"
            className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
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
                  Continue with Google
                </button>
                <p className="my-4 text-center text-xs text-zinc-500">or with your email</p>
              </>
            )}
            <form
              onSubmit={submit}
              className={`grid gap-4 ${mode === "forgot" || mode === "reset" ? "mt-6" : ""}`}
            >
              {mode === "signup" && (
                <div className="grid gap-1">
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
                <div className="grid gap-1">
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
                <div className="grid gap-1">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="auth-password">
                      {mode === "reset" ? "New password" : "Password"}
                    </Label>
                    {mode === "login" && (
                      <Link
                        href="/forgot-password"
                        className="text-xs text-blue-700 underline dark:text-blue-400"
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
                  className="rounded-md border border-red-300 bg-red-50 p-2.5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className={`${primaryButtonClass} py-2.5 disabled:opacity-60`}
              >
                {busy ? "One moment…" : copy.submit}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "login" && (
            <>
              New here?{" "}
              <Link
                href={`/signup${nextQuery}`}
                className="font-medium text-blue-700 underline dark:text-blue-400"
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
                className="font-medium text-blue-700 underline dark:text-blue-400"
              >
                Log in
              </Link>
            </>
          )}
          {mode === "forgot" && (
            <Link href="/login" className="font-medium text-blue-700 underline dark:text-blue-400">
              Back to log in
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
