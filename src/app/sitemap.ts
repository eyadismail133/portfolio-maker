import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Public pages of the app. Published portfolios are found through their own links. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/templates", "/pro", "/new", "/terms", "/privacy", "/refunds"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/templates" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/templates" ? 0.9 : 0.5,
  }));
}
