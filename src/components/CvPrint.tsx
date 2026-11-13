"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonClass, primaryButtonClass, Segmented } from "@/editor/ui";
import { buildCv, type Cv, type CvEntry } from "@/lib/cv";
import { hasFeature, type Plan } from "@/lib/plans";
import { friendlyError, getMyPlan, getPortfolio } from "@/lib/portfolios";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import type { Lang } from "@/render-kit/schema/primitives";

/**
 * A one- or two-page CV made from the portfolio, laid out for A4. "Download PDF" opens the
 * browser's print dialog, where "Save as PDF" makes the file. Pro only.
 */
export function CvPrint({ portfolioId }: { portfolioId: string }) {
  const [doc, setDoc] = useState<PortfolioDoc | null>(null);
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>("en");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    Promise.all([getPortfolio(portfolioId), getMyPlan()])
      .then(([found, myPlan]) => {
        setPlan(myPlan);
        if (!found) return setProblem("This portfolio was not found.");
        setDoc(found.doc);
        setLang(found.doc.meta.languages[0]);
      })
      .catch((error) => setProblem(friendlyError(error)));
  }, [portfolioId]);

  const cv = useMemo(() => (doc ? buildCv(doc, lang) : null), [doc, lang]);
  const allowed = hasFeature(plan, "pdfCv");

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-900 print:bg-white dark:bg-zinc-950 dark:text-zinc-100">
      <style>{`@page { size: A4; margin: 14mm 14mm; } @media print { html, body { background: #fff !important; } }`}</style>
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-5 py-3 print:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={`/editor/${portfolioId}`} className="text-sm font-semibold">
          ← Back to the editor
        </Link>
        {doc && doc.meta.languages.length > 1 && (
          <span className="w-40">
            <Segmented
              label="CV language"
              value={lang}
              onChange={setLang}
              options={doc.meta.languages.map(
                (l) => [l, l === "en" ? "English" : "Arabic"] as const,
              )}
            />
          </span>
        )}
        {cv && allowed && (
          <span className="ms-auto flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              In the print window choose “Save as PDF”.
            </span>
            <button type="button" className={primaryButtonClass} onClick={() => window.print()}>
              Download PDF
            </button>
          </span>
        )}
      </header>
      {problem && (
        <p role="alert" className="mx-auto mt-8 max-w-xl px-5 text-sm text-red-700">
          {problem}
        </p>
      )}
      {plan !== undefined && !allowed && !problem && (
        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-violet-300 bg-violet-50 p-6 text-sm print:hidden dark:border-violet-900 dark:bg-violet-950">
          <p className="font-semibold">The PDF CV is part of Pro</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Pro turns your portfolio into a print-ready CV in English or Arabic, from the same text
            you already wrote.
          </p>
          <Link href="/pro" className={`${buttonClass} mt-4 inline-block`}>
            See Pro
          </Link>
        </div>
      )}
      {cv && allowed && <CvSheet cv={cv} />}
      {!cv && !problem && plan === undefined && (
        <p className="mt-10 text-center text-sm text-zinc-500">Preparing your CV…</p>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page">
      <h2 className="mb-2 border-b border-zinc-300 pb-1 text-[11pt] font-bold tracking-wide text-zinc-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entries({ items }: { items: CvEntry[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((e, i) => (
        <li key={i} className="break-inside-avoid">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="text-[10.5pt] font-semibold">{e.title}</h3>
            {e.when && <span className="text-[9pt] text-zinc-600 tabular-nums">{e.when}</span>}
          </div>
          {e.place && <p className="text-[9.5pt] text-zinc-700">{e.place}</p>}
          {e.text && <p className="mt-1 text-[9.5pt] leading-snug">{e.text}</p>}
          {e.points.length > 0 && (
            <ul className="mt-1 list-disc ps-4 text-[9.5pt] leading-snug">
              {e.points.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The A4 sheet itself: a narrow side column for contact, skills and languages, the rest wide. */
function CvSheet({ cv }: { cv: Cv }) {
  const side = cv.contact.length + cv.skills.length + cv.languages.length > 0;
  return (
    <article
      lang={cv.lang}
      dir={cv.lang === "ar" ? "rtl" : "ltr"}
      className="mx-auto my-8 w-full max-w-[210mm] bg-white p-[14mm] text-[10pt] leading-normal text-zinc-900 shadow-lg print:my-0 print:max-w-none print:p-0 print:shadow-none"
      style={{
        fontFamily:
          cv.lang === "ar"
            ? "'IBM Plex Sans Arabic', Tahoma, sans-serif"
            : "Inter, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <header className="flex items-center gap-5 border-b-2 border-zinc-900 pb-4">
        {cv.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- printed as is, no resizing
          <img src={cv.photo} alt="" className="size-20 shrink-0 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-[20pt] font-bold leading-tight">{cv.name}</h1>
          {cv.title && <p className="text-[11.5pt] text-zinc-700">{cv.title}</p>}
        </div>
      </header>
      <div className={`mt-5 grid gap-6 ${side ? "grid-cols-[1fr_2.4fr]" : ""}`}>
        {side && (
          <aside className="grid content-start gap-5">
            {cv.contact.length > 0 && (
              <Block title={cv.headings.contact}>
                <ul className="grid gap-1.5 text-[9pt]">
                  {cv.contact.map((c, i) => (
                    <li key={i}>
                      <span className="block text-zinc-500">{c.label}</span>
                      {c.href ? (
                        <a href={c.href} dir="ltr" className="break-all text-zinc-900">
                          {c.value}
                        </a>
                      ) : (
                        <span>{c.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Block>
            )}
            {cv.skills.length > 0 && (
              <Block title={cv.headings.skills}>
                <div className="grid gap-2 text-[9pt]">
                  {cv.skills.map((g, i) => (
                    <div key={i}>
                      {g.group && <p className="font-semibold">{g.group}</p>}
                      <p>{g.items.join(cv.lang === "ar" ? "، " : ", ")}</p>
                    </div>
                  ))}
                </div>
              </Block>
            )}
            {cv.languages.length > 0 && (
              <Block title={cv.headings.languages}>
                <ul className="grid gap-1 text-[9pt]">
                  {cv.languages.map((l, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>{l.name}</span>
                      <span className="text-zinc-600">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </aside>
        )}
        <div className="grid content-start gap-5">
          {cv.summary && (
            <Block title={cv.headings.summary}>
              <p className="whitespace-pre-line text-[9.5pt] leading-snug">{cv.summary}</p>
            </Block>
          )}
          {cv.experience.length > 0 && (
            <Block title={cv.headings.experience}>
              <Entries items={cv.experience} />
            </Block>
          )}
          {cv.education.length > 0 && (
            <Block title={cv.headings.education}>
              <Entries items={cv.education} />
            </Block>
          )}
          {cv.projects.length > 0 && (
            <Block title={cv.headings.projects}>
              <Entries items={cv.projects} />
            </Block>
          )}
          {cv.certificates.length > 0 && (
            <Block title={cv.headings.certificates}>
              <Entries items={cv.certificates} />
            </Block>
          )}
          {cv.awards.length > 0 && (
            <Block title={cv.headings.awards}>
              <Entries items={cv.awards} />
            </Block>
          )}
          {cv.publications.length > 0 && (
            <Block title={cv.headings.publications}>
              <Entries items={cv.publications} />
            </Block>
          )}
        </div>
      </div>
    </article>
  );
}
