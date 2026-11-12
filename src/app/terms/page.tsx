import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms · Portfolio Maker" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms are an agreement between you and {SITE.legalName} ({SITE.name}, &quot;we&quot;).
        By creating an account or publishing a page you accept them. If you do not agree, do not use
        the service.
      </p>
      <h2>Your account</h2>
      <ul>
        <li>You need to be at least 16 years old to create an account.</li>
        <li>Keep your password safe. You are responsible for what happens in your account.</li>
        <li>Give a real email address; we use it for sign-in, receipts and important notices.</li>
      </ul>
      <h2>Your content</h2>
      <ul>
        <li>
          What you write and upload stays yours. You give us permission to store it, show it on your
          published pages and make the copies needed to run the service.
        </li>
        <li>
          Only publish what you have the right to publish: your own words and work, and images you
          are allowed to use.
        </li>
        <li>
          Do not publish anything illegal, misleading, hateful, sexual content involving minors,
          other people&apos;s private information, or pages that collect passwords or payment
          details.
        </li>
        <li>
          We may take a page offline or close an account that breaks these rules, and we may act on
          reports from visitors.
        </li>
      </ul>
      <h2>Free and Pro</h2>
      <ul>
        <li>
          The Free plan has the limits shown on the Pro page. We may change Free limits; we will not
          delete content because of a change.
        </li>
        <li>
          Pro is paid in advance for the months you choose and does not renew by itself. When it
          ends, your account returns to Free and nothing is deleted.
        </li>
        <li>
          Payments are handled by Paymob. Refunds follow our{" "}
          <a href="/refunds" className="underline">
            refund policy
          </a>
          .
        </li>
      </ul>
      <h2>AI writing</h2>
      <p>
        AI writing suggestions are created by an outside AI service and can be wrong. Check every
        suggestion before you publish it; you are responsible for what your page says.
      </p>
      <h2>The service</h2>
      <ul>
        <li>
          We work to keep the service running and your data safe, but we cannot promise it will
          never be interrupted. Keep your own copy of important work.
        </li>
        <li>
          To the extent the law allows, we are not liable for indirect losses, such as lost business
          or lost profit, from using the service.
        </li>
        <li>
          We may change these terms. If a change matters, we will tell you by email or in the app
          before it takes effect.
        </li>
      </ul>
      <h2>Law and contact</h2>
      <p>
        These terms follow the laws of {SITE.country}. Questions:{" "}
        <a href={`mailto:${SITE.contactEmail}`} className="underline">
          {SITE.contactEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}
