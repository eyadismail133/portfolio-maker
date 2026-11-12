import { registerSections, type AnySectionDefinition } from "../registry";
import { about } from "./about";
import { awards } from "./awards";
import { caseStudy } from "./case-study";
import { certificates } from "./certificates";
import { contact } from "./contact";
import { cta } from "./cta";
import { cvDownload } from "./cv-download";
import { divider } from "./divider";
import { education } from "./education";
import { faq } from "./faq";
import { features } from "./features";
import { footer } from "./footer";
import { gallery } from "./gallery";
import { hero } from "./hero";
import { howItWorks } from "./how-it-works";
import { imageText } from "./image-text";
import { interests } from "./interests";
import { languages } from "./languages";
import { logoStrip } from "./logo-strip";
import { map } from "./map";
import { missionValues } from "./mission-values";
import { navbar } from "./navbar";
import { newsletter } from "./newsletter";
import { partners } from "./partners";
import { press } from "./press";
import { pricing } from "./pricing";
import { problemSolution } from "./problem-solution";
import { projects } from "./projects";
import { quote } from "./quote";
import { services } from "./services";
import { skills } from "./skills";
import { socialLinks } from "./social-links";
import { stats } from "./stats";
import { team } from "./team";
import { testimonials } from "./testimonials";
import { text } from "./text";
import { timeline } from "./timeline";
import { video } from "./video";
import { workExperience } from "./work-experience";

/** Every section type, in the order the "Add section" library shows them. Add new sections here. */
export const sections: AnySectionDefinition[] = [
  // Start of page
  navbar,
  hero,
  logoStrip,
  // Profile
  about,
  workExperience,
  education,
  skills,
  languages,
  certificates,
  awards,
  interests,
  cvDownload,
  // Work
  projects,
  caseStudy,
  gallery,
  video,
  // Business
  services,
  features,
  problemSolution,
  howItWorks,
  stats,
  team,
  pricing,
  timeline,
  press,
  partners,
  missionValues,
  // Trust and conversion
  testimonials,
  faq,
  cta,
  newsletter,
  contact,
  map,
  socialLinks,
  // Free blocks
  text,
  imageText,
  quote,
  divider,
  footer,
];

registerSections(sections);
