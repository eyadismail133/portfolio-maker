import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Reset password · Portfolio Maker" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="forgot" />
    </Suspense>
  );
}
