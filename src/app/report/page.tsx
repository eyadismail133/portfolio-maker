import { headers } from "next/headers";
import { Suspense } from "react";
import { ReportForm } from "@/components/ReportForm";
import { isAppHost } from "@/lib/custom-domain";
import { turnstileSiteKey } from "@/lib/visitor-check";

export const metadata = { title: "Report a page · Portfolio Maker", robots: { index: false } };

/** The spam check runs on the app's own hostnames only (see src/lib/visitor-check.ts). */
async function ReportWithCheck() {
  const host = (await headers()).get("host") ?? "";
  const siteKey = !host || isAppHost(host) ? turnstileSiteKey() : null;
  return <ReportForm siteKey={siteKey} />;
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportWithCheck />
    </Suspense>
  );
}
