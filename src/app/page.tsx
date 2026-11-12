import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        A portfolio page that looks designed, without designing it
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Answer eight short questions, pick one of six starting designs, then fill in your own
        details.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/new"
          className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Start my portfolio
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Log in
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        <Link href="/editor" className="underline">
          Try the editor
        </Link>{" "}
        or{" "}
        <Link href="/dev/render" className="underline">
          see the designs
        </Link>
        , no account needed.
      </p>
    </main>
  );
}
