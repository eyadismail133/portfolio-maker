import { Suspense } from "react";
import { PaymentResult } from "@/components/PaymentResult";

export const metadata = { title: "Payment · Portfolio Maker", robots: { index: false } };

export default function PaymentDonePage() {
  return (
    <Suspense>
      <PaymentResult />
    </Suspense>
  );
}
