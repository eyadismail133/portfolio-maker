import { LegalPage } from "@/components/LegalPage";
import { formatPrice, MONTHLY_PRICE } from "@/lib/plans";
import { SITE } from "@/lib/site";

export const metadata = { title: "Refunds · Portfolio Maker" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund policy">
      <p>
        Pro costs {formatPrice(MONTHLY_PRICE.EGP, "EGP")} or {formatPrice(MONTHLY_PRICE.USD, "USD")}{" "}
        a month and is paid in advance for the months you choose. It never renews by itself, so you
        are never charged without buying again.
      </p>
      <h2>When you can get your money back</h2>
      <ul>
        <li>
          <strong>First purchase:</strong> if Pro is not right for you, ask within 14 days of your
          first payment for a full refund.
        </li>
        <li>
          <strong>Charged twice or charged by mistake:</strong> we refund the extra payment in full,
          at any time.
        </li>
        <li>
          <strong>The service did not work:</strong> if a problem on our side stopped you from using
          Pro, we refund the affected time.
        </li>
      </ul>
      <p>
        Months already used after the first 14 days, and later purchases, are not refunded unless
        one of the points above applies.
      </p>
      <h2>How to ask</h2>
      <p>
        Write to{" "}
        <a href={`mailto:${SITE.contactEmail}`} className="underline">
          {SITE.contactEmail}
        </a>{" "}
        from your account&apos;s email address with the date of the payment. We answer within 5
        working days. Refunds go back to the method you paid with through Paymob; your bank or
        wallet may take a few more days to show it.
      </p>
      <p>
        When a refund is made, Pro ends and your account returns to Free. Nothing you made is
        deleted.
      </p>
    </LegalPage>
  );
}
