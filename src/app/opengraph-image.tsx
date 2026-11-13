import { shareCard } from "@/lib/og-card";

export const alt = "Portfolio Maker: one story, every design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share image of the app's own pages. */
export default async function Image() {
  return shareCard({
    title: "Fill in your story once. See it in every design.",
    subtitle: "Portfolio pages in English and Arabic",
    footer: "Portfolio Maker",
    background: "#0f1117",
    text: "#f4f4f5",
    accent: "#4f6bff",
  });
}
