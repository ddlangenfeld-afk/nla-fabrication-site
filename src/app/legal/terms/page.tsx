import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Placeholder terms of service for ${SITE_NAME}.`,
  alternates: { canonical: "/legal/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="Draft — not yet reviewed">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">What you&rsquo;re buying</h2>
        <p className="mt-2">
          {SITE_NAME} sells aftermarket, 3D-printed reproduction parts. These are not
          original manufacturer parts and are not affiliated with, sponsored by, or
          endorsed by any vehicle manufacturer. OEM part numbers referenced in product
          listings identify compatibility only.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Orders and payment</h2>
        <p className="mt-2">
          Orders are processed through Stripe Checkout. Parts are made to order in
          small batches; production and shipping timelines are estimates, not
          guarantees.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Fit and use</h2>
        <p className="mt-2">
          Parts are modeled to fit the compatibility listed on each product page.
          Installation is the buyer&rsquo;s responsibility; this is not a substitute
          for professional service where one is warranted.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Limitation of liability</h2>
        <p className="mt-2">
          Placeholder language only. A real limitation-of-liability clause needs legal
          review before this store accepts real orders.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
        <p className="mt-2">
          Questions can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
