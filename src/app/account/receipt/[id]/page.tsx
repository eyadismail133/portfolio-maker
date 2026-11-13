"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Receipt } from "@/components/Receipt";

function Page() {
  const { id } = useParams<{ id: string }>();
  return <Receipt paymentId={id} />;
}

/** A printable receipt for one paid Pro purchase. Only its owner can read the payment. */
export default function ReceiptPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
