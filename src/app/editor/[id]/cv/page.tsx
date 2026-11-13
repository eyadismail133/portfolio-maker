"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { CvPrint } from "@/components/CvPrint";

function Cv() {
  const { id } = useParams<{ id: string }>();
  return <CvPrint portfolioId={id} />;
}

/** A print-ready CV from a saved portfolio (Pro). */
export default function CvPage() {
  return (
    <Suspense>
      <Cv />
    </Suspense>
  );
}
