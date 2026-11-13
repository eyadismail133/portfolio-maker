import { createSampleDoc, type SampleKind } from "@/render-kit/samples";
import type { PortfolioDoc } from "@/render-kit/schema/document";
import { families } from "@/render-kit/themes/families";

/** Ready-made starting points shown on /templates: every design family with fitting sample content. */
export type Template = {
  id: string;
  name: string;
  family: string;
  kind: SampleKind;
  /** Who it suits, in one line. */
  forWhom: string;
};

const KIND_FOR: Record<string, SampleKind> = {
  corporate: "company",
  bold: "company",
  elegant: "company",
  tech: "startup",
  gradient: "startup",
  glass: "startup",
  creative: "startup",
};

const FOR_WHOM: Record<string, string> = {
  minimal: "Anyone who wants calm and clear",
  bold: "Agencies and confident brands",
  elegant: "Consultants, architects and studios",
  tech: "Developer tools and software startups",
  corporate: "Companies, clinics and firms",
  creative: "Designers, artists and small studios",
  playful: "Students, food and kids' brands",
  editorial: "Writers, journalists and researchers",
  brutalist: "Designers and bold personal brands",
  glass: "Apps and modern products",
  gradient: "Startups launching something new",
  "classic-cv": "Job seekers and academics",
};

export const TEMPLATES: Template[] = families.map((family) => {
  const kind = KIND_FOR[family.id] ?? "personal";
  return {
    id: `${family.id}-${kind}`,
    name: `${family.name} ${kind === "personal" ? "portfolio" : kind === "company" ? "company page" : "startup page"}`,
    family: family.id,
    kind,
    forWhom: FOR_WHOM[family.id] ?? family.feeling,
  };
});

export function templateDoc(id: string): PortfolioDoc | null {
  const template = TEMPLATES.find((t) => t.id === id);
  return template ? createSampleDoc({ family: template.family, kind: template.kind }) : null;
}
