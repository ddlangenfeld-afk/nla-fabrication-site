import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Placeholder privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: "/legal/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Draft — not yet reviewed">
      <p>
        This placeholder describes, in general terms, what {SITE_NAME} expects a real
        privacy policy to cover. It is not a substitute for a policy reviewed against
        applicable law before the store accepts real orders.
      </p>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Information collected</h2>
        <p className="mt-2">
          Checkout is processed by Stripe; {SITE_NAME} does not directly store payment
          card details. Order information (name, shipping address, email, and items
          purchased) is retained to fulfill orders and respond to support requests.
          Contact form submissions store the name, email, and message provided.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">How information is used</h2>
        <p className="mt-2">
          Solely to fulfill orders, respond to inquiries, and meet legal or tax
          obligations. No information is sold to third parties.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Third-party services</h2>
        <p className="mt-2">
          Payment processing via Stripe and, where configured, transactional email via
          Resend. Both process data under their own privacy policies.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
        <p className="mt-2">
          Questions about this placeholder policy can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
