"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { buttonClass, inputClass, Label, primaryButtonClass, Segmented } from "@/editor/ui";
import { readAnswers, writeAnswers } from "@/lib/local-drafts";
import { clearPicture, readPicture, writePicture } from "@/lib/picture-store";
import { FIELDS } from "@/recommend/content";
import { LOOKS } from "@/recommend/generate";
import {
  ASSETS,
  EMPTY_ANSWERS,
  isOrganisation,
  STYLES,
  WHO,
  type Answers,
  type AssetKind,
  type Goal,
  type StyleId,
  type Who,
} from "@/recommend/types";
import { pickText } from "@/render-kit/i18n";
import { createSampleDoc } from "@/render-kit/samples";
import { palettes } from "@/render-kit/themes/palettes";
import { MiniPreview } from "./MiniPreview";
import { UiLanguageSwitch } from "@/components/UiLanguageSwitch";

const WHO_TEXT: Record<Who, [string, string]> = {
  professional: ["Me, as a professional", "A personal page for your career"],
  student: ["Me, as a student", "Studies, projects and first experience"],
  freelancer: ["Me, as a freelancer", "Services and work that win clients"],
  creative: ["Me, as a creative", "Design, photo, video or art"],
  company: ["A company", "Services, team and proof you deliver"],
  agency: ["An agency or studio", "Client work and what you offer"],
  startup: ["A startup", "A product, its story and its traction"],
  other: ["Something else", "Start general and shape it yourself"],
};

const GOAL_TEXT: Record<Goal, [string, string]> = {
  hired: ["Get hired", "Show experience and skills to employers"],
  clients: ["Get clients", "Explain what you offer and make contact easy"],
  investors: ["Attract investors", "Problem, solution, numbers and team"],
  signups: ["Get sign-ups", "Turn visitors into users or subscribers"],
  showcase: ["Show my work", "Put the work itself first"],
};

const STYLE_TEXT: Record<StyleId, [string, string]> = {
  minimal: ["Minimal", "Calm, lots of space"],
  bold: ["Bold", "Loud and confident"],
  elegant: ["Elegant", "Refined, serif type"],
  playful: ["Playful", "Round and friendly"],
  tech: ["Tech", "Dark, built for products"],
  editorial: ["Editorial", "Like a magazine"],
  corporate: ["Corporate", "Clear and trustworthy"],
  creative: ["Creative", "Unexpected shapes"],
};

const ASSET_TEXT: Record<AssetKind, string> = {
  photos: "Photos of me or the team",
  projectImages: "Pictures of my work",
  logo: "A logo",
  testimonials: "Quotes from clients or colleagues",
  cv: "A CV file",
  video: "A video",
  clientLogos: "Logos of clients or employers",
  numbers: "Numbers worth showing",
};

const STEPS = [
  "Who is this portfolio for?",
  "What is your field?",
  "What should it achieve?",
  "Which style feels like you?",
  "Which colors?",
  "What do you have ready?",
  "Which language?",
  "Last step: the basics",
];

function Choice(props: {
  selected: boolean;
  onClick: () => void;
  title: string;
  text?: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`overflow-hidden rounded-xl border text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 ${
        props.selected
          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:bg-blue-950"
          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
      }`}
    >
      {props.children}
      <span className="block px-4 py-3">
        <span className="block text-sm font-semibold">{props.title}</span>
        {props.text && (
          <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
            {props.text}
          </span>
        )}
      </span>
    </button>
  );
}

/** An optional photo (people) or logo (organisations), kept in the browser until it is uploaded. */
function PicturePicker({ organisation }: { organisation: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const kind = organisation ? "logo" : "photo";

  useEffect(() => {
    let url: string | null = null;
    readPicture().then((picture) => {
      if (!picture) return;
      url = URL.createObjectURL(picture.file);
      setPreview(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const choose = async (file: File | undefined) => {
    setProblem("");
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setProblem("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 25 * 1024 * 1024) return setProblem("This file is larger than 25 MB.");
    if (!(await writePicture({ file, name: file.name, kind })))
      return setProblem("Your browser could not keep this file. Add it in the editor instead.");
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const remove = async () => {
    await clearPicture();
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="onboarding-picture">
        {organisation ? "Your logo (optional)" : "Your photo (optional)"}
      </Label>
      <div className="flex items-center gap-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview, not a page image
          <img
            src={preview}
            alt=""
            className={`h-14 w-14 border border-zinc-200 bg-white object-cover dark:border-zinc-700 ${organisation ? "rounded-md object-contain" : "rounded-full"}`}
          />
        )}
        <input
          id="onboarding-picture"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm file:me-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm dark:file:border-zinc-700 dark:file:bg-zinc-900"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        {preview && (
          <button type="button" className={buttonClass} onClick={remove}>
            Remove
          </button>
        )}
      </div>
      {problem && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {problem}
        </p>
      )}
    </div>
  );
}

/** The eight onboarding questions. Answers are kept in the browser, so no account is needed yet. */
export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const set = (patch: Partial<Answers>) => setAnswers((current) => ({ ...current, ...patch }));

  // Pick up earlier answers when someone comes back from the ideas page.
  useEffect(() => {
    const saved = readAnswers();
    if (saved && typeof saved === "object")
      Promise.resolve().then(() =>
        setAnswers({ ...EMPTY_ANSWERS, ...(saved as Partial<Answers>) }),
      );
  }, []);

  const stylePreviews = useMemo(
    () =>
      Object.fromEntries(
        STYLES.map((style) => {
          const look = LOOKS[style][0];
          const doc = createSampleDoc({
            family: look.family,
            fonts: look.fonts,
            sections: ["hero"],
            languages: ["en"],
          });
          return [
            style,
            look.radius ? { ...doc, theme: { ...doc.theme, radius: look.radius } } : doc,
          ];
        }),
      ),
    [],
  );

  const last = step === STEPS.length - 1;
  const organisation = isOrganisation(answers.who);
  const next = () => {
    if (!last) return setStep(step + 1);
    writeAnswers(answers);
    router.push("/new/ideas");
  };
  const toggle = <T,>(list: T[], item: T, max = Infinity) =>
    list.includes(item)
      ? list.filter((x) => x !== item)
      : list.length < max
        ? [...list, item]
        : list;

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center gap-4 px-5 py-4">
        <Link href="/" className="text-sm font-semibold">
          Portfolio Maker
        </Link>
        <div className="ms-auto flex items-center gap-3">
          <UiLanguageSwitch />
          <span className="text-xs text-zinc-500">{`Question ${step + 1} of ${STEPS.length}`}</span>
          <div
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width]"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-10 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{STEPS[step]}</h1>

        <div className="mt-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {WHO.map((who) => (
                <Choice
                  key={who}
                  selected={answers.who === who}
                  onClick={() => set({ who })}
                  title={WHO_TEXT[who][0]}
                  text={WHO_TEXT[who][1]}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                We use it to write sample text that sounds like your work.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <Choice
                    key={field.id}
                    selected={answers.field === field.id}
                    onClick={() => set({ field: field.id })}
                    title={pickText(field.name, "en")}
                  />
                ))}
                <Choice
                  selected={answers.field === "other"}
                  onClick={() => set({ field: "other" })}
                  title="Something else"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(GOAL_TEXT) as Goal[]).map((goal) => (
                <Choice
                  key={goal}
                  selected={answers.goal === goal}
                  onClick={() => set({ goal })}
                  title={GOAL_TEXT[goal][0]}
                  text={GOAL_TEXT[goal][1]}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Pick one or two. You can change the design at any time later.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STYLES.map((style) => (
                  <Choice
                    key={style}
                    selected={answers.styles.includes(style)}
                    disabled={!answers.styles.includes(style) && answers.styles.length >= 2}
                    onClick={() => set({ styles: toggle(answers.styles, style, 2) })}
                    title={STYLE_TEXT[style][0]}
                    text={STYLE_TEXT[style][1]}
                  >
                    <MiniPreview
                      doc={stylePreviews[style]}
                      className="border-b border-zinc-200 dark:border-zinc-800"
                    />
                  </Choice>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <div className="grid gap-6">
              <div>
                <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                  Pick a ready set, use your own brand color, or skip and let each idea choose.
                </p>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
                  {palettes.map((palette) => {
                    const selected = !answers.brandColor && answers.palette === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          set({ palette: selected ? null : palette.id, brandColor: null })
                        }
                        className="grid gap-1 rounded-lg p-1 text-center focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <span
                          className={`mx-auto block aspect-square w-full max-w-14 rounded-full border-2 border-white ring-1 dark:border-zinc-900 ${selected ? "ring-2 ring-blue-600" : "ring-zinc-300 dark:ring-zinc-700"}`}
                          style={{
                            background: `linear-gradient(135deg, ${palette.light.primary} 50%, ${palette.light.accent} 50%)`,
                          }}
                        />
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          {palette.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="onboarding-brand"
                  type="color"
                  value={answers.brandColor ?? "#1f4fd8"}
                  onChange={(e) => set({ brandColor: e.target.value, palette: null })}
                  className="size-10 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
                />
                <Label htmlFor="onboarding-brand">
                  {answers.brandColor
                    ? `Using your color ${answers.brandColor}`
                    : "I have a brand color"}
                </Label>
                {answers.brandColor && (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => set({ brandColor: null })}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid max-w-md gap-1.5">
                <Label>Light or dark</Label>
                <Segmented
                  label="Light or dark"
                  value={answers.mode ?? "any"}
                  onChange={(mode) => set({ mode: mode === "any" ? null : mode })}
                  options={[
                    ["any", "No preference"],
                    ["light", "Light"],
                    ["dark", "Dark"],
                    ["both", "Visitor's choice"],
                  ]}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Tick everything you already have. Sections for the rest are added switched off, so
                you can turn them on later.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ASSETS.map((asset) => (
                  <label
                    key={asset}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm has-checked:border-blue-600 has-checked:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:has-checked:bg-blue-950"
                  >
                    <input
                      type="checkbox"
                      checked={answers.assets.includes(asset)}
                      onChange={() => set({ assets: toggle(answers.assets, asset) })}
                    />
                    {ASSET_TEXT[asset]}
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Choice
                selected={answers.languages.join() === "en"}
                onClick={() => set({ languages: ["en"] })}
                title="English"
              />
              <Choice
                selected={answers.languages.join() === "ar"}
                onClick={() => set({ languages: ["ar"] })}
                title="العربية"
                text="Arabic, right to left"
              />
              <Choice
                selected={answers.languages.length === 2}
                onClick={() => set({ languages: ["en", "ar"] })}
                title="Both"
                text="Visitors can read either; you write each text twice"
              />
            </div>
          )}

          {step === 7 && (
            <div className="grid max-w-md gap-4">
              <div className="grid gap-1">
                <Label htmlFor="onboarding-name">
                  {organisation ? "Company name" : "Your name"}
                </Label>
                <input
                  id="onboarding-name"
                  className={inputClass}
                  dir="auto"
                  autoComplete={organisation ? "organization" : "name"}
                  value={answers.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="onboarding-title">
                  {organisation
                    ? "What you do, in one line"
                    : "Your job title or one-line description"}
                </Label>
                <input
                  id="onboarding-title"
                  className={inputClass}
                  dir="auto"
                  placeholder={organisation ? "Accounting for small businesses" : "Civil engineer"}
                  value={answers.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <PicturePicker organisation={organisation} />
              <p className="text-xs text-zinc-500">
                {organisation
                  ? "These go straight into your starter ideas. The logo is added when you open one; you can change it later in the editor."
                  : "These go straight into your starter ideas. The photo is added when you open one; you can change it later in the editor."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            className={`${buttonClass} px-4 py-2`}
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
          <button type="button" className={`${primaryButtonClass} px-5 py-2`} onClick={next}>
            {last ? "Show my ideas" : "Continue"}
          </button>
          {!last && (
            <button
              type="button"
              className="rounded px-2 py-2 text-sm text-zinc-600 underline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-zinc-400"
              onClick={() => setStep(step + 1)}
            >
              Skip this question
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
