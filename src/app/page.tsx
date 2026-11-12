import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Portfolio Maker</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Pick a design, fill in your data, and get a portfolio page you can publish.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/editor"
          className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Open the editor
        </Link>
        <Link
          href="/dev/render"
          className="rounded-md border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          See the designs
        </Link>
      </div>
    </main>
  );
}
