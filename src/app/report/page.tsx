import { Suspense } from "react";
import { ReportForm } from "@/components/ReportForm";

export const metadata = { title: "Report a page · Portfolio Maker", robots: { index: false } };

export default function ReportPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
