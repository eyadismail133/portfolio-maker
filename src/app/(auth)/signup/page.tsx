import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Create account · Portfolio Maker" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
