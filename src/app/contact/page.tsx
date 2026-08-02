import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with NLA Fabrication — ask about fitment, suggest a part for the pipeline, or follow up on an order.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="glow-band border-b border-line">
        <div className="shell py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Contact</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Fitment question, order issue, or a part suggestion — all welcome.
          </h1>
          <p className="mt-4 max-w-xl text-ink-secondary">
            This is a one-person shop, so replies come from the person who actually
            modeled and printed the part. Expect a response within a day or two.
          </p>
        </div>
      </section>

      <section className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div>
          <ContactForm />
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">
            Prefer email?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {/* A rail that earns the space: what to include so the first reply can
            actually answer the question instead of asking for details. */}
        <aside aria-labelledby="what-helps" className="lg:pt-1">
          <h2
            id="what-helps"
            className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
          >
            What helps
          </h2>
          <dl className="mt-5 space-y-6 border-t border-line pt-6">
            {[
              [
                "Your chassis and year",
                "EK, EJ, or EM1 and the model year. Some parts changed mid-generation — the 96–98 climate panel is not the 99–00 one.",
              ],
              [
                "A photo of the broken part",
                "Especially for fitment questions. The failure point usually identifies the variant faster than a part number does.",
              ],
              [
                "An OEM part number, if you have one",
                "Off the part itself or a dealer catalog. It settles compatibility immediately.",
              ],
              [
                "For an order, the email you checked out with",
                "Orders are looked up by the address Stripe has, not by name.",
              ],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-medium text-ink">{term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-ink-muted">
            Suggesting a part for the pipeline? Say what keeps breaking and how you
            know it&rsquo;s unavailable — that&rsquo;s exactly how the current catalog
            got chosen.
          </p>
        </aside>
      </section>
    </>
  );
}
