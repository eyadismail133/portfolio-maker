import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { UiTranslator } from "@/components/UiTranslator";
import { UI_LANG_SCRIPT } from "@/lib/i18n/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio Maker",
  description: "Build a rich portfolio landing page in minutes.",
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
