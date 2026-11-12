import { connection } from "next/server";
import { Suspense } from "react";
import { GoPro } from "@/components/GoPro";
import { paymobConfig } from "@/lib/billing/paymob";

export const metadata = { title: "Pro · Portfolio Maker" };

async function Content() {
  // Read the payment settings for each visit, so switching payments on needs no new build.
  await connection();
  return <GoPro currencies={paymobConfig().currencies} />;
}

export default function ProPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
