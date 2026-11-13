import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { UiTranslator } from "@/components/UiTranslator";
import { UI_LANG_SCRIPT } from "@/lib/i18n/ui";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Portfolio Maker",
  description:
    "Build a portfolio page for a person, a company or a startup, in English and Arabic, with 12 designs and 43 sections.",
  openGraph: {
    title: "Portfolio Maker",
    description: "Fill in your story once. See it in every design. In English and Arabic.",
    siteName: "Portfolio Maker",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets right-to-left before the first paint when the interface is in Arabic. */}
        <script dangerouslySetInnerHTML={{ __html: UI_LANG_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
        <Suspense fallback={null}>
          <UiTranslator />
        </Suspense>
      </body>
    </html>
  );
}
