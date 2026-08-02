import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: `Placeholder shipping and returns policy for ${SITE_NAME}.`,
  alternates: { canonical: "/legal/shipping-returns" },
  robots: { index: false, follow: true },
};

export default function ShippingReturnsPage() {
  return (
    <LegalPage title="Shipping & Returns" updated="Draft — not yet reviewed">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Production time</h2>
        <p className="mt-2">
          Components are produced against orders rather than held in bulk stock.
          Typical production is 3–5 business days before dispatch, stated on each
          product page. This is an estimate, not a guarantee.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Shipping</h2>
        <p className="mt-2">
          Domestic shipping only at launch. Carrier, rates and transit times are
          placeholders pending a finalised fulfilment arrangement — nothing here should
          be treated as final until live orders have shipped.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Returns</h2>
        <p className="mt-2">
          Because components are produced to order, returns are assessed case by case.
          A production defect or fitment failure is remedied at our cost. A firm return
          window and process still need to be finalised before launch.
        </p>
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
        <p className="mt-2">
          For order support, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
