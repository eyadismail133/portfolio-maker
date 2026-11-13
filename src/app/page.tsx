import Link from "next/link";
import { DesignStage } from "@/components/DesignStage";
import { MiniPreview } from "@/components/MiniPreview";
import { Reveal, RevealItem, RevealList } from "@/components/Reveal";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";
import { BrandMark, UiIcon, type UiIconName } from "@/editor/ui";
import { createSampleDoc } from "@/render-kit/samples";

const STEPS: { title: string; text: string; icon: UiIconName }[] = [
  {
    title: "Answer eight questions",
    text: "Who the page is for, what it should achieve, the style you like. Two minutes.",
    icon: "sparkles",
  },
  {
    title: "Pick one of six starts",
    text: "Each one already has your name, the right sections and sample text for your field.",
    icon: "layers",
  },
  {
    title: "Fill in, then publish",
    text: "Edit next to a live preview. Publish to your own link or download the HTML.",
    icon: "zap",
  },
];

const FEATURES: { title: string; text: string; icon: UiIconName; tint: string }[] = [
  {
    title: "Real portfolio fields",
    text: "Experience, education, skills with levels, languages, projects. Not empty text boxes.",
    icon: "fileText",
    tint: "from-blue-600/15 to-indigo-600/15 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Arabic and English",
    text: "Right-to-left layouts and Arabic fonts in every design, and pages in both languages.",
    icon: "globe",
    tint: "from-violet-600/15 to-fuchsia-600/15 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Phones first",
    text: "Every section is built to work from a small phone up to a wide screen.",
    icon: "phone",
    tint: "from-emerald-600/15 to-teal-600/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Messages and visits",
    text: "The contact form delivers to your inbox, and you can see how many people visited.",
    icon: "mail",
    tint: "from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Yours to keep",
    text: "With Pro, download a clean HTML version of your page and host it anywhere you like.",
    icon: "code",
    tint: "from-cyan-600/15 to-blue-600/15 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "43 sections, 12 designs",
    text: "From a CV-style profile to a startup page with pricing, team and FAQ.",
    icon: "palette",
    tint: "from-rose-600/15 to-pink-600/15 text-rose-600 dark:text-rose-400",
  },
];

export default function Home() {
  return (
    <div className="pm-aurora-bg min-h-dvh overflow-x-hidden bg-zinc-50/70 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Ambient decorative background grid and floating orbs */}
      <div aria-hidden="true" className="pm-grid-pattern pointer-events-none fixed inset-0 -z-10" />

      <header className="pm-glass-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3.5">
          <Link href="/" className="group inline-flex items-center gap-2.5 font-semibold">
            <BrandMark />
            <span className="hidden text-base tracking-tight sm:inline">Portfolio Maker</span>
          </Link>
          <nav className="ms-auto flex items-center gap-2 text-sm">
            <UiLanguageSwitch />
            <Link
              href="/templates"
              className="hidden rounded-lg px-3.5 py-2 font-medium sm:inline-block text-zinc-700 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white"
            >
              Templates
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap rounded-lg px-3 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/new"
              className="pm-btn-primary inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium text-white"
            >
              <span>Start free</span>
              <UiIcon name="arrowRight" size={14} className="rtl:rotate-180" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-22">
          <div className="pm-animate-in inline-flex items-center gap-2.5 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-blue-700 shadow-2xs backdrop-blur-md dark:border-blue-900/70 dark:bg-zinc-900/80 dark:text-blue-300">
            <span className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>43 sections, 12 designs</span>
          </div>

          <h1 className="pm-animate-in pm-stagger-1 mt-6 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-balance sm:text-6xl lg:text-[4.15rem]">
            Fill in your story once. See it in every design.
          </h1>

          <p className="pm-animate-in pm-stagger-2 mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
            A portfolio page for a person, a company or a startup, built from your real details.
            Change the whole design in one click; your content stays.
          </p>

          <div className="pm-animate-in pm-stagger-3 mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href="/new"
              className="pm-btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>Start my portfolio</span>
              <UiIcon
                name="arrowRight"
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              />
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/90 bg-white/90 px-6 py-3.5 text-base font-medium text-zinc-800 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white hover:shadow-md dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              <UiIcon name="palette" size={17} className="text-indigo-600 dark:text-indigo-400" />
              <span>Try the editor first</span>
            </Link>
          </div>
          <p className="pm-animate-in pm-stagger-4 mt-4 flex items-center gap-2 text-sm text-zinc-500">
            <UiIcon name="check" size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>No account needed to try. Free to publish.</span>
          </p>

          <DesignStage />
        </section>

        {/* 3-Step Workflow Section */}
        <section className="relative border-y border-zinc-200/80 bg-white/75 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl">
              From nothing to a live page
            </Reveal>
            <RevealList as="ol" className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <RevealItem
                  key={step.title}
                  className="pm-card group relative grid content-start gap-3.5 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/20">
                      {i + 1}
                    </span>
                    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400">
                      <UiIcon name={step.icon} size={18} />
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.text}
                  </p>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </section>

        {/* Arabic RTL Showcase Section */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="pm-card relative grid gap-10 overflow-hidden rounded-3xl p-6 sm:p-10 lg:grid-cols-[1fr_1.35fr] lg:items-center lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -end-24 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/15 via-indigo-500/15 to-violet-500/15 blur-3xl"
            />
            <div className="relative z-10">
              <div
                aria-hidden="true"
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/70 dark:text-indigo-300"
              >
                <UiIcon name="globe" size={13} />
                <span data-no-translate>RTL · العربية / EN</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Arabic is not an afterthought
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                Every design reads right to left with its own Arabic font. Write each text in both
                languages and visitors switch with one link.
              </p>
            </div>
            <div className="relative z-10 overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/80">
              <div aria-hidden="true" className="mb-2 flex items-center gap-1.5 px-2 pt-1">
                <span className="size-2.5 rounded-full bg-rose-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <span
                  data-no-translate
                  className="ms-2 rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500"
                >
                  /p/nile-ledger/ar
                </span>
              </div>
              <MiniPreview
                doc={createSampleDoc({ family: "corporate", kind: "company" })}
                lang="ar"
                className="rounded-xl border border-zinc-200/80 shadow-sm dark:border-zinc-800"
              />
            </div>
          </div>
        </section>

        {/* Bento Features Grid */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <Reveal as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl">
            What you get
          </Reveal>
          <RevealList className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {FEATURES.map((feature) => (
              <RevealItem key={feature.title} className="pm-card group rounded-2xl p-6">
                <div
                  className={`inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.tint} ring-1 ring-current/15`}
                >
                  <UiIcon name={feature.icon} size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {feature.text}
                </p>
              </RevealItem>
            ))}
          </RevealList>
        </section>

        {/* Bottom CTA Section */}
        <section className="mx-auto max-w-6xl px-5 pb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-14 text-white shadow-2xl shadow-indigo-600/25 sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pm-grid-pattern pointer-events-none absolute inset-0 opacity-25"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl"
            />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
                Your page can be live in ten minutes
              </h2>
              <Link
                href="/new"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Start my portfolio</span>
                <UiIcon
                  name="arrowRight"
                  size={17}
                  className="transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 bg-white/60 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-sm text-zinc-500">
          <span className="inline-flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <BrandMark size="sm" />
            <span>Portfolio Maker</span>
          </span>
          <div className="ms-auto flex flex-wrap items-center gap-5">
            <Link
              href="/templates"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Templates
            </Link>
            <Link
              href="/pro"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Pricing
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy
            </Link>
            <Link
              href="/refunds"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Refunds
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
