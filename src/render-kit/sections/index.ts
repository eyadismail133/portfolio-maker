import { registerSections, type AnySectionDefinition } from "../registry";
import { about } from "./about";
import { contact } from "./contact";
import { cta } from "./cta";
import { education } from "./education";
import { footer } from "./footer";
import { hero } from "./hero";
import { languages } from "./languages";
import { navbar } from "./navbar";
import { projects } from "./projects";
import { skills } from "./skills";
import { testimonials } from "./testimonials";
import { workExperience } from "./work-experience";

/** Every section type. Add new sections here. */
export const sections: AnySectionDefinition[] = [
  navbar,
  hero,
  about,
  workExperience,
  education,
  skills,
  languages,
  projects,
  testimonials,
  contact,
  cta,
  footer,
];

registerSections(sections);
