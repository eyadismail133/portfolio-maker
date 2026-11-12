import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
        The link may be mistyped, or the portfolio was taken offline by its owner.
      </p>
      <Link
        href="/"
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Go to Portfolio Maker
      </Link>
    </main>
  );
}
