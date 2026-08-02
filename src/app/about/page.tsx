import type { Metadata } from "next";
import Link from "next/link";
import { Reveal, RevealLines } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About — Engineering discontinued EK/EJ Civic components",
  description:
    "NLA Fabrication reverse-engineers discontinued interior components for the 1996–2000 Civic. Every part is selected from documented failure data, validated on the chassis, and produced to order in engineering-grade PETG.",
  alternates: { canonical: "/about" },
};

const process = [
  {
    step: "01",
    title: "Failure analysis",
    body: "Candidates come from documented, recurring field failures — not from what is convenient to produce. We identify the specific mode: which section cracks, under what load, and at what point in the component's service life.",
  },
  {
    step: "02",
    title: "Supply verification",
    body: "Discontinuation is confirmed against the manufacturer's own parts catalog, and secondary-market pricing is reviewed as a demand signal. If a new replacement is available from any source, we do not tool the part.",
  },
  {
    step: "03",
    title: "Design and specification",
    body: "Hard-surface CAD from original geometry, with material and build orientation specified against the component's actual load path. Where the original section was the limiting factor, the reproduction is reinforced there.",
  },
  {
    step: "04",
    title: "Fitment validation",
    body: "No component is released for sale until it has been installed on the chassis and checked against original mounting points, clearances and operation. This is the release gate, and nothing bypasses it.",
  },
];

const standards: [string, string][] = [
  [
    "Material specified to the environment",
    "PETG is selected for cabin components because it retains its properties through dash-top thermal cycling that softens lower-grade filament. It is not specified for underhood use, and we do not sell it into that application.",
  ],
  [
    "Build orientation is an engineering decision",
    "Layer boundaries are the weak axis in any fused-deposition part. Orientation is set per component so that service loads run along the strongest axis rather than across a layer line.",
  ],
  [
    "Reinforcement where the original failed",
    "A reproduction that copies the original exactly reproduces the original's failure. Section thickness is increased at documented crack initiation points, within the envelope the factory mounting allows.",
  ],
  [
    "Fitment validated before release",
    "Every catalog component has been installed on the chassis it is sold for. This is the reason the catalog grows deliberately rather than quickly.",
  ],
];

const disclosures: [string, string][] = [
  [
    "These are aftermarket reproductions.",
    "They are not original manufacturer parts, and we are not affiliated with, sponsored by, or endorsed by any vehicle manufacturer. OEM part numbers appear on this site solely to identify compatibility.",
  ],
  [
    "Additive manufacturing is not injection moulding.",
    "Printed components carry visible layer lines and a different failure behaviour to the original. Where that trade-off is material to the application, specification is chosen to land on the correct side of it — and where a printed part would underperform the original, we do not produce it.",
  ],
  [
    "Interior components only, at present.",
    "Underhood applications require materials with a different thermal and chemical profile. Those components will ship in ASA or nylon once qualified, and are not yet released.",
  ],
  [
    "Lead times reflect made-to-order production.",
    "Components are produced against orders rather than held in bulk stock. Current dispatch is 3–5 business days.",
  ],
];

export default function AboutPage() {
  return (
    <>
      {/* Above the fold, so the entrance is the CSS-only one. The scroll
          reveals below wait on hydration; the h1 is the LCP element and
          must not. */}
      <section className="glow-band border-b border-line">
        <div className="shell py-16 sm:py-24">
          <p className="hero-in font-mono text-xs uppercase tracking-[0.18em] text-accent">
            About
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-3xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-5xl 2xl:text-6xl">
            {[<>We manufacture the components</>, <>the supply chain stopped making.</>].map(
              (line, i) => (
                <span key={i} className="hero-line">
                  <span style={{ "--hero-delay": `${60 + i * 70}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              )
            )}
          </h1>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-24">
          <Reveal
            as="p"
            className="font-mono text-xs uppercase tracking-[0.18em] text-accent lg:sticky lg:top-32"
          >
            What we do
          </Reveal>
          <Reveal
            delay={120}
            className="measure space-y-6 text-base leading-relaxed text-ink-secondary sm:text-lg"
          >
            <p>
              NLA Fabrication reverse-engineers and produces discontinued interior
              components for the 1996–2000 Civic. We operate in a narrow segment on
              purpose: a short catalog of parts with confirmed supply gaps, each one
              engineered against a specific documented failure rather than adapted from a
              generic pattern.
            </p>
            <p>
              The work is hard-surface CAD, materials specification and production
              engineering. Reproducing a latch mechanism accurately enough to install into
              25-year-old mounting points without modification is a dimensional problem
              with a tolerance budget, and it is treated as one — original geometry in,
              validated fitment out.
            </p>
            <p>
              We compete on precision and availability, not on breadth. A catalog of three
              components that install correctly is worth more to an owner mid-repair than a
              catalog of three hundred that require trimming, shimming or a second order.
            </p>
            <p className="border-l-2 border-accent pl-6 text-ink">
              The name states the premise. &ldquo;NLA&rdquo; is the designation a parts
              catalog applies when a component is out of production permanently:{" "}
              <em>No Longer Available</em>. Everything we list carried that designation
              before we brought it back.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="process-heading" className="border-b border-line bg-bg-raised">
        <div className="shell py-14 sm:py-20">
          <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Process
          </Reveal>
          <RevealLines
            as="h2"
            id="process-heading"
            delay={90}
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            lines={[<>From failure report to released part</>]}
          />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {process.map((item, i) => (
              <Reveal key={item.step} as="li" delay={i * 110} className="flex">
                <div className="card-rise flex w-full flex-col border border-line bg-bg p-6 sm:p-8">
                  <p className="font-mono text-2xs tracking-widest text-accent">{item.step}</p>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="standards-heading" className="border-b border-line">
        <div className="shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-24">
          <RevealLines
            as="h2"
            id="standards-heading"
            className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl lg:sticky lg:top-32"
            lines={[<>Engineering</>, <>standards</>]}
          />
          <dl className="grid gap-x-16 gap-y-8 sm:grid-cols-2">
            {standards.map(([term, detail], i) => (
              <Reveal key={term} delay={i * 100}>
                <dt className="font-display text-base font-semibold text-ink">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-secondary">{detail}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="disclosures-heading" className="border-b border-line bg-bg-inset">
        <div className="shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-24">
          <RevealLines
            as="h2"
            id="disclosures-heading"
            className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl lg:sticky lg:top-32"
            lines={[<>What we state</>, <>up front</>]}
          />
          <dl className="grid gap-x-16 gap-y-8 sm:grid-cols-2">
            {disclosures.map(([term, detail], i) => (
              <Reveal key={term} delay={i * 100}>
                <dt className="font-display text-base font-semibold text-ink">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-secondary">{detail}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="glow-band">
        <div className="shell flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <RevealLines
            as="p"
            className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl"
            lines={[<>Have a component that belongs in the catalog?</>]}
          />
          <Reveal delay={120} className="shrink-0">
            <Link
              href="/contact"
              className="btn-accent inline-block bg-accent px-7 py-3.5 font-medium text-accent-ink hover:bg-accent-bright"
            >
              Contact us
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
