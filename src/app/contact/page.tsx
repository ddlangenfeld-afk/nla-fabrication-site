import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with NLA Fabrication — ask about fitment, suggest a part for the pipeline, or follow up on an order.",
  alternates: { canonical: "/contact" },
};

const whatHelps: [string, string][] = [
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
];

export default function ContactPage() {
  return (
    <>
      {/* CSS-only entrance above the fold — the h1 is the LCP element here and
          can't wait on hydration. Everything below scroll-reveals. */}
      <section className="glow-band border-b border-line">
        <div className="shell py-16 sm:py-20">
          <p className="hero-in font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Contact
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {[<>Fitment question, order issue,</>, <>or a part suggestion — all welcome.</>].map(
              (line, i) => (
                <span key={i} className="hero-line">
                  <span style={{ "--hero-delay": `${60 + i * 70}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              )
            )}
          </h1>
          <p
            className="hero-in mt-4 max-w-xl text-ink-secondary"
            style={{ "--hero-delay": "260ms" } as React.CSSProperties}
          >
            This is a one-person shop, so replies come from the person who actually
            modeled and printed the part. Expect a response within a day or two.
          </p>
        </div>
      </section>

      <section className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <Reveal>
          <ContactForm />
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">
            Prefer email?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Reveal>

        {/* A rail that earns the space: what to include so the first reply can
            actually answer the question instead of asking for details. */}
        <aside aria-labelledby="what-helps" className="lg:pt-1">
          <Reveal
            as="h2"
            id="what-helps"
            delay={90}
            className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
          >
            What helps
          </Reveal>
          {/* One reveal around the whole rail rather than one per row. A <dl>
              may wrap each dt/dd pair in a single <div> and no more, so a
              per-row Reveal plus a hover row would be a div inside a div —
              invalid, and axe catches it. The rows also want fast hover
              transitions, which they can't have while sharing an element with
              a 1s staggered reveal. */}
          <Reveal delay={140}>
            <dl className="mt-5 space-y-px border-t border-line pt-5">
              {whatHelps.map(([term, detail]) => (
                // Each row is its own hover target: the left border lights and
                // the row shifts, so the rail reads as a list you can scan
                // rather than a wall of small print.
                <div
                  key={term}
                  className="group -mx-4 border-l border-transparent px-4 py-3 transition-[border-color,background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:border-accent hover:bg-bg-raised/60 motion-reduce:hover:translate-x-0"
                >
                  <dt className="text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    {term}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{detail}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal
            as="p"
            delay={520}
            className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-ink-muted"
          >
            Suggesting a part for the pipeline? Say what keeps breaking and how you
            know it&rsquo;s unavailable — that&rsquo;s exactly how the current catalog
            got chosen.
          </Reveal>
        </aside>
      </section>
    </>
  );
}
