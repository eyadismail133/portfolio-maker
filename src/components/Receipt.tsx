"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/editor/ui";
import { receiptNumber } from "@/lib/billing/receipt-number";
import { formatPrice, MONTHLY_PRICE } from "@/lib/plans";
import { friendlyError, getMyAccount } from "@/lib/portfolios";
import { listPayments, type PaymentRecord } from "@/lib/publishing";
import { SITE } from "@/lib/site";

/** A receipt to print or save as PDF. Built from the payment row the account can read. */
export function Receipt({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<PaymentRecord | null | undefined>(undefined);
  const [buyer, setBuyer] = useState("");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    Promise.all([listPayments(), getMyAccount()])
      .then(([payments, account]) => {
        setPayment(payments.find((p) => p.id === paymentId && p.status === "paid") ?? null);
        setBuyer(account?.email ?? "");
      })
      .catch((error) => setProblem(friendlyError(error)));
  }, [paymentId]);

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-zinc-100 px-4 py-8 text-zinc-900 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl gap-3 print:hidden">
        <Link href="/account" className={buttonClass}>
          ← Account
        </Link>
        {payment && (
          <button type="button" className={`${buttonClass} ms-auto`} onClick={() => window.print()}>
            Print or save as PDF
          </button>
        )}
      </div>
      {problem && <p className="mx-auto max-w-2xl text-sm text-red-700">{problem}</p>}
      {payment === null && (
        <p className="mx-auto max-w-2xl text-sm text-zinc-600">
          This receipt was not found. Receipts exist for completed payments of this account only.
        </p>
      )}
      {payment && (
        <article className="mx-auto max-w-2xl rounded-lg bg-white p-10 shadow print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6">
            <div>
              <h1 className="text-2xl font-semibold">Receipt</h1>
              <p className="mt-1 text-sm text-zinc-600">{receiptNumber(payment.id)}</p>
            </div>
            <div className="text-end text-sm">
              <p className="font-semibold">{SITE.legalName}</p>
              <p className="text-zinc-600">{SITE.contactEmail}</p>
              <p className="text-zinc-600">{SITE.country}</p>
            </div>
          </header>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-zinc-500">Paid on</dt>
            <dd>{date(payment.paidAt ?? payment.createdAt)}</dd>
            <dt className="text-zinc-500">Billed to</dt>
            <dd>{buyer || "Your account"}</dd>
            <dt className="text-zinc-500">Paid with</dt>
            <dd>Paymob</dd>
          </dl>
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-start text-xs text-zinc-500">
                <th className="py-2 text-start font-medium">Item</th>
                <th className="py-2 text-end font-medium">Price a month</th>
                <th className="py-2 text-end font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="py-3">
                  {SITE.name} Pro, {payment.months} month{payment.months > 1 ? "s" : ""} (prepaid,
                  does not renew)
                </td>
                <td className="py-3 text-end">
                  {formatPrice(MONTHLY_PRICE[payment.currency], payment.currency)}
                </td>
                <td className="py-3 text-end">
                  {formatPrice(payment.amountCents, payment.currency)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-4 font-semibold" colSpan={2}>
                  Total paid
                </td>
                <td className="pt-4 text-end font-semibold">
                  {formatPrice(payment.amountCents, payment.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-10 text-xs text-zinc-500">
            Thank you for supporting {SITE.name}. Questions about this payment: {SITE.contactEmail}.
          </p>
        </article>
      )}
    </div>
  );
}
