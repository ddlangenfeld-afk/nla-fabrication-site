import type { Metadata } from "next";
import Link from "next/link";
import { PipelineList } from "@/components/PipelineList";
import { ProductCard } from "@/components/ProductCard";
import { Reveal, RevealLines } from "@/components/Reveal";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { getAllProducts, getAvailableProducts, getComingSoonProducts } from "@/lib/products";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "NLA Fabrication — Discontinued 96–00 Civic (EK/EJ) Parts, Reproduced",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const shopFacts = [
  "Modeled from original geometry",
  "Fitment-validated on the chassis",
  "Engineering-grade PETG",
  "Produced to order",
];

export default function HomePage() {
  const available = getAvailableProducts();
  const pipeline = getComingSoonProducts();
  const allProducts = getAllProducts();

  return (
    <>
      {/* Hero — WebGL part behind, type in front. The canvas is decorative and
          loads after mount, so the headline stays the LCP element. */}
      <section className="glow-band relative isolate overflow-hidden border-b border-line">
        <div className="relative shell grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <div>
            {/* CSS-only entrance — see .hero-in in globals.css. These are the
                first things painted, so they must not wait on hydration. */}
            <p className="hero-in font-mono text-xs uppercase tracking-[0.18em] text-accent">
              EK · EJ · 1996–2000 Civic
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl 2xl:text-7xl">
              {[
                <>The parts marked</>,
                <>&ldquo;No&nbsp;Longer Available.&rdquo;</>,
                <>Made&nbsp;available.</>,
              ].map((line, i) => (
                <span key={i} className="hero-line">
                  <span style={{ "--hero-delay": `${60 + i * 70}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p
              className="hero-in mt-6 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg"
              style={{ "--hero-delay": "280ms" } as React.CSSProperties}
            >
              Precision-manufactured replacements for discontinued interior components
              on the 96–00 Civic. Every part is modeled from original geometry, produced
              in engineering-grade PETG, and validated on the chassis before it is
              released for sale.
            </p>
            <div
              className="hero-in mt-9 flex flex-wrap gap-3"
              style={{ "--hero-delay": "360ms" } as React.CSSProperties}
            >
              <Link
                href="/shop"
                className="btn-accent bg-accent px-7 py-3.5 font-medium text-accent-ink hover:bg-accent-bright"
              >
                Browse parts
              </Link>
              <Link
                href="/about"
                className="hover-lift inline-block border border-line-strong px-7 py-3.5 font-medium text-ink-secondary hover:border-accent hover:text-ink"
              >
                Our process
              </Link>
            </div>
          </div>

          {/* Spec title-block card. The drawing area is a live CAD viewport:
              the same part in 3D, with the title block beneath it — so the
              geometry and its data stay one object rather than two competing
              focal points. Falls back to the 2D drawing everywhere WebGL
              isn't used. */}
          <aside
            aria-label="Featured part specification"
            className="hidden self-start border border-line-strong bg-bg-raised lg:block"
          >
            <div className="relative aspect-[4/3] border-b border-line">
              <HeroCanvas />
            </div>
            <dl>
              {[
                ["Part no.", "77540-S04-003ZA"],
                ["Status", "Discontinued → Reproduced"],
                ["Material", "PETG"],
                ["Fitment", "96–00 Civic EK/EJ"],
              ].map(([term, detail]) => (
                <div
                  key={term}
                  className="grid grid-cols-[100px_1fr] border-b border-line last:border-b-0"
                >
                  <dt className="border-r border-line px-4 py-2.5 font-mono text-2xs uppercase tracking-wider text-ink-muted">
                    {term}
                  </dt>
                  <dd className="px-4 py-2.5 font-mono text-2xs tracking-wide text-ink-secondary">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* Shop facts strip */}
      <section aria-label="How parts are made" className="border-b border-line bg-bg-inset">
        <ul className="shell flex flex-wrap gap-x-10 gap-y-2 py-4">
          {shopFacts.map((fact) => (
            <li
              key={fact}
              className="flex items-center gap-2.5 font-mono text-2xs uppercase tracking-widest text-ink-muted"
            >
              <span aria-hidden="true" className="h-1 w-1 bg-accent" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products */}
      <section aria-labelledby="available-heading" className="border-b border-line">
        <div className="shell py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Available now
              </Reveal>
              <RevealLines
                as="h2"
                delay={90}
                className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                id="available-heading"
                lines={[<>In production and shipping now</>]}
              />
            </div>
            <Link
              href="/shop"
              className="hidden shrink-0 font-mono text-xs uppercase tracking-widest text-ink-secondary transition-colors hover:text-accent sm:block"
            >
              All parts →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((product, i) => (
              <Reveal key={product.slug} delay={i * 110} className="flex">
                <ProductCard
                  product={product}
                  index={allProducts.indexOf(product) + 1}
                />
              </Reveal>
            ))}
          </div>
          <Link
            href="/shop"
            className="mt-8 block text-center font-mono text-xs uppercase tracking-widest text-ink-secondary transition-colors hover:text-accent sm:hidden"
          >
            All parts →
          </Link>
        </div>
      </section>

      {/* Story */}
      <section aria-labelledby="story-heading" className="border-b border-line bg-bg-raised">
        <div className="shell grid gap-10 py-20 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-24">
          <div className="lg:sticky lg:top-32">
            <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              The supply problem
            </Reveal>
            <RevealLines
              as="h2"
              delay={90}
              className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl"
              id="story-heading"
              lines={[
                <>Discontinued does not</>,
                <>have to mean unavailable.</>,
              ]}
            />
          </div>
          <Reveal delay={140} className="space-y-5 text-base leading-relaxed text-ink-secondary">
            <p>
              The interior components on this chassis were built to a 1990s cost target and
              have now aged past it. Serviceable assemblies fail at predictable points, and
              the factory has marked the replacements{" "}
              <strong className="font-medium text-ink">NLA — No Longer Available</strong>.
              The remaining supply is salvage: the same 25-year-old plastic, at the same
              point in its service life as the part it is replacing.
            </p>
            <p>
              We manufacture the replacements instead. Each component is reverse-engineered
              from original geometry, re-specified in a material chosen for the cabin
              environment, and reinforced where the original section was the limiting
              factor. Print orientation is set so that loads run along the strongest axis
              rather than across layer boundaries.
            </p>
            <p>
              Selection is driven by failure data, not by what is easy to produce. A part
              enters the catalog only when the failure is documented and recurring, the
              discontinuation is confirmed against the manufacturer&rsquo;s own parts
              catalog, and no new replacement exists from any source.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-labelledby="pipeline-heading" className="border-b border-line">
        <div className="shell py-16 sm:py-20">
          <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            In development
          </Reveal>
          <RevealLines
            as="h2"
            delay={90}
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            id="pipeline-heading"
            lines={[<>In engineering</>]}
          />
          <p className="mt-3 max-w-xl text-ink-secondary">
            Components currently in engineering. Each one is released only after fitment
            validation on the chassis — which is why the catalog grows deliberately.
          </p>
          <Reveal delay={120} className="mt-8">
            <PipelineList products={pipeline} startIndex={available.length + 1} />
          </Reveal>
        </div>
      </section>

      {/* Request-a-part CTA */}
      <section aria-labelledby="cta-heading" className="glow-band">
        <div className="shell py-16 text-center sm:py-24">
          <RevealLines
            as="h2"
            className="mx-auto max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            id="cta-heading"
            lines={[
              <>Sourcing a discontinued</>,
              <>component we don&rsquo;t list yet?</>,
            ]}
          />
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            Our development queue is prioritised by documented failure rates and confirmed
            supply gaps. Submit a part and we will assess it against both.
          </p>
          <Link
            href="/contact"
            className="btn-accent mt-8 inline-block bg-accent px-7 py-3.5 font-medium text-accent-ink hover:bg-accent-bright"
          >
            Submit a part request
          </Link>
        </div>
      </section>
    </>
  );
}
