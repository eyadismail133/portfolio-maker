import Link from "next/link";
import { MiniPreview } from "@/components/MiniPreview";
import { createSampleDoc } from "@/render-kit/samples";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";

const EXAMPLES = [
  { family: "minimal", label: "Minimal" },
  { family: "tech", label: "Tech" },
  { family: "elegant", label: "Elegant" },
  { family: "creative", label: "Creative" },
] as const;

const STEPS = [
  {
    title: "Answer eight questions",
    text: "Who the page is for, what it should achieve, the style you like. Two minutes.",
  },
  {
    title: "Pick one of six starts",
    text: "Each one already has your name, the right sections and sample text for your field.",
  },
  {
    title: "Fill in, then publish",
    text: "Edit next to a live preview. Publish to your own link or download the HTML.",
  },
];

const FEATURES = [
  {
    title: "Real portfolio fields",
    text: "Experience, education, skills with levels, languages, projects. Not empty text boxes.",
  },
  {
    title: "Arabic and English",
    text: "Right-to-left layouts and Arabic fonts in every design, and pages in both languages.",
  },
  {
    title: "Phones first",
    text: "Every section is built to work from a small phone up to a wide screen.",
  },
  {
    title: "Messages and visits",
    text: "The contact form delivers to your inbox, and you can see how many people visited.",
  },
  {
    title: "Yours to keep",
    text: "With Pro, download a clean HTML version of your page and host it anywhere you like.",
  },
  {
    title: "43 sections, 12 designs",
    text: "From a CV-style profile to a startup page with pricing, team and FAQ.",
  },
];

export default function Home() {
  return (
    <div className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <span className="font-semibold">Portfolio Maker</span>
        <nav className="ms-auto flex items-center gap-2 text-sm">
          <UiLanguageSwitch />
          <Link
            href="/templates"
            className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Templates
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/new"
            className="rounded-md bg-blue-600 px-3.5 py-2 font-medium text-white hover:bg-blue-700"
          >
            Start free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-6xl">
            Fill in your story once. See it in every design.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            A portfolio page for a person, a company or a startup, built from your real details.
            Change the whole design in one click; your content stays.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/new"
              className="rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Start my portfolio
            </Link>
            <Link
              href="/editor"
              className="rounded-md border border-zinc-300 px-5 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Try the editor first
            </Link>
          </div>
          <p className="mt-3 text-sm text-zinc-500">No account needed to try. Free to publish.</p>

          <ul className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {EXAMPLES.map((example) => (
              <li key={example.family}>
                <figure>
                  <MiniPreview
                    doc={createSampleDoc({ family: example.family, languages: ["en"] })}
                    className="rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800"
                  />
                  <figcaption className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {example.label}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-zinc-500">
            The same portfolio, four designs. Nothing was retyped.
          </p>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              From nothing to a live page
            </h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="grid content-start gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-semibold dark:border-zinc-700">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Arabic is not an afterthought
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Every design reads right to left with its own Arabic font. Write each text in both
              languages and visitors switch with one link.
            </p>
          </div>
          <MiniPreview
            doc={createSampleDoc({ family: "corporate", kind: "company" })}
            lang="ar"
            className="rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800"
          />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What you get</h2>
          <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="border-t border-zinc-200 pt-4 dark:border-zinc-800"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-blue-600 text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-14">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Your page can be live in ten minutes
            </h2>
            <Link
              href="/new"
              className="rounded-md bg-white px-5 py-3 font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start my portfolio
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 py-8 text-sm text-zinc-500">
        <span>Portfolio Maker</span>
        <Link href="/templates" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Templates
        </Link>
        <Link href="/pro" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Pricing
        </Link>
        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Privacy
        </Link>
        <Link href="/refunds" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Refunds
        </Link>
      </footer>
    </div>
  );
}
