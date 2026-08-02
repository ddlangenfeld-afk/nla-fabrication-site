import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { COLORS, CUSTOM_COLOR } from "@/lib/colors";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact NLA Fabrication for fitment verification, order support, or to submit a discontinued component for engineering assessment.",
  alternates: { canonical: "/contact" },
};

const whatHelps: [string, string][] = [
  [
    "Chassis code and model year",
    "EK, EJ or EM1, with the model year. Several components changed mid-generation — the 96–98 climate panel is not interchangeable with the 99–00 unit.",
  ],
  [
    "A photograph of the failed component",
    "Particularly for fitment enquiries. The failure mode usually identifies the variant faster than a part number does.",
  ],
  [
    "An OEM part number where available",
    "From the component itself or a dealer catalog. It resolves compatibility immediately.",
  ],
  [
    "For order support, the checkout email address",
    "Orders are retrieved against the address on the payment record rather than by name.",
  ],
];

/*
 * Reading searchParams makes this route dynamic rather than prerendered. That
 * is the deliberate trade for the custom-finish deep link: doing the prefill
 * client-side with useSearchParams would need a Suspense boundary, wouldn't
 * work with JS disabled, and would flash an empty textarea before hydrating.
 * A contact page is not a page whose static rendering is worth defending.
 */
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;

  // Never render arbitrary query text into the form. The subject is only used
  // to look up one of our own product names; anything else is discarded.
  const requested = typeof subject === "string" ? subject : "";
  const isCustomFinish = requested.startsWith("Custom colour — ");
  const partName = isCustomFinish
    ? requested.slice("Custom colour — ".length).slice(0, 80)
    : "";

  const prefill = isCustomFinish
    ? `Custom finish request\n\nPart: ${partName}\nColour wanted: \nQuantity: (minimum ${CUSTOM_COLOR.minimumUnits})\nChassis / year: \n`
    : "";

  return renderContact(prefill, isCustomFinish);
}

function renderContact(prefill: string, isCustomFinish: boolean) {
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
            {[<>Technical enquiries, order support,</>, <>and component submissions.</>].map(
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
            Technical questions are answered by the people who model and validate the
            components, not by a scripted support tier. Expect a response within one
            business day.
          </p>
        </div>
      </section>

      <section className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <Reveal>
          {isCustomFinish && (
            <div className="mb-8 border border-accent/40 bg-accent/10 p-5">
              <p className="font-display text-base font-semibold text-ink">
                Custom finish enquiry
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                Custom colours are quoted rather than listed. Minimum{" "}
                {CUSTOM_COLOR.minimumUnits} units, ${CUSTOM_COLOR.setupFeeUsd} setup to
                cover sourcing the material, {CUSTOM_COLOR.leadTimeWeeks} weeks lead time.
                Below that threshold the {COLORS.length} standard finishes ship in 3–5
                business days.
              </p>
            </div>
          )}
          <ContactForm prefillMessage={prefill} />
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">
            Direct enquiries:{" "}
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
            Submitting a component for assessment? Describe the failure mode and the
            evidence that no replacement is available. Both are weighted directly in our
            development queue.
          </Reveal>
        </aside>
      </section>
    </>
  );
}
