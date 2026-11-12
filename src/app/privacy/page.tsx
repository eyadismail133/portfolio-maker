import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy · Portfolio Maker" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This page explains what {SITE.name} collects, why, and what you can do about it. We do not
        sell personal data.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your email address, name and an encrypted password, or your
          Google sign-in details if you use Google.
        </li>
        <li>
          <strong>Your portfolios:</strong> the text, images and settings you add, and your answers
          to the start questions.
        </li>
        <li>
          <strong>Payments:</strong> what you bought, the amount and the date. Card and wallet
          details go to Paymob and never reach us.
        </li>
        <li>
          <strong>Messages:</strong> what visitors send through the contact form on your published
          page, including their name and email.
        </li>
        <li>
          <strong>Visits:</strong> a count of visits per page per day. We do not store
          visitors&apos; IP addresses or use advertising cookies.
        </li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>
          To run your account, save and publish your work, and deliver contact messages to you.
        </li>
        <li>To take payments and keep records the law requires.</li>
        <li>To prevent abuse and to answer reports about published pages.</li>
      </ul>
      <h2>Who else handles it</h2>
      <ul>
        <li>
          <strong>Supabase:</strong> stores the database, accounts and images.
        </li>
        <li>
          <strong>Vercel:</strong> runs the website.
        </li>
        <li>
          <strong>Paymob:</strong> processes payments.
        </li>
        <li>
          <strong>Google (Gemini):</strong> receives the text you choose to send to AI writing, on
          Pro. Do not send private information to AI writing.
        </li>
        <li>
          <strong>Google Fonts:</strong> published pages load fonts from Google, which sees the
          visitor&apos;s IP address.
        </li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>
          You can change or delete any portfolio at any time, and take published pages offline.
        </li>
        <li>
          You can delete your whole account from the Account page. This removes your portfolios,
          messages and images. Payment records may be kept as long as the law requires.
        </li>
        <li>
          For a copy of your data or any privacy question, write to{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline">
            {SITE.contactEmail}
          </a>
          .
        </li>
      </ul>
      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in. The editor also keeps an unsaved draft
        in your browser.
      </p>
    </LegalPage>
  );
}
