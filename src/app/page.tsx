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
  "Printed in PETG",
  "Test-fitted on the shop's own EK",
  "Small-batch, made to order",
];

export default function HomePage() {
  const available = getAvailableProducts();
  const pipeline = getComingSoonProducts();
  const allProducts = getAllProducts();

  return (
    <>
      {/* Hero — WebGL part behind, type in front. The canvas is decorative and
          loads after mount, so the headline stays the LCP element. */}
      <section className="blueprint-grid relative isolate overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            {/* CSS-only entrance — see .hero-in in globals.css. These are the
                first things painted, so they must not wait on hydration. */}
            <p className="hero-in font-mono text-xs uppercase tracking-[0.18em] text-accent">
              EK · EJ · 1996–2000 Civic
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
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
              Precision 3D-printed reproductions of discontinued interior parts for the
              96–00 Civic — modeled from original geometry, printed in PETG, and shipped
              from a one-person shop that drives the same chassis.
            </p>
            <div
              className="hero-in mt-9 flex flex-wrap gap-3"
              style={{ "--hero-delay": "360ms" } as React.CSSProperties}
            >
              <Link
                href="/shop"
                className="bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
              >
                Browse parts
              </Link>
              <Link
                href="/about"
                className="border border-line-strong px-7 py-3.5 font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
              >
                Why this exists
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
        <ul className="mx-auto flex max-w-6xl flex-wrap gap-x-10 gap-y-2 px-4 py-4 sm:px-6">
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
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Available now
              </Reveal>
              <RevealLines
                as="h2"
                delay={90}
                className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                lines={[<>Three parts you can stop hunting for</>]}
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              Why these parts exist
            </Reveal>
            <RevealLines
              as="h2"
              delay={90}
              className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl"
              lines={[
                <>This shop exists because a</>,
                <>glove box wouldn&rsquo;t stay shut.</>,
              ]}
            />
          </div>
          <Reveal delay={140} className="space-y-5 text-base leading-relaxed text-ink-secondary">
            <p>
              The founder restored and wrapped his own 1996 Civic, then hit the wall every
              EK owner eventually hits: the small plastic parts are gone. The factory
              marked them{" "}
              <strong className="font-medium text-ink">NLA — No Longer Available</strong> —
              years ago, and the used market sells you the same 25-year-old brittle plastic
              that just broke on your car.
            </p>
            <p>
              He&rsquo;s a hard-surface 3D designer by trade. So instead of watching parts
              listings, he started modeling the broken parts from their original geometry
              and printing them in materials chosen for the job — PETG for the cabin,
              because it shrugs off the dash-top heat that softens hobby filament.
            </p>
            <p>
              Every part in this catalog was picked the same way: a documented, recurring
              failure on this chassis, confirmed discontinued, with no new replacement on
              the market. Not merch. Not gadgets. The parts that keep an EK usable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-labelledby="pipeline-heading" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal as="p" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            In development
          </Reveal>
          <RevealLines
            as="h2"
            delay={90}
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            lines={[<>The pipeline</>]}
          />
          <p className="mt-3 max-w-xl text-ink-secondary">
            Each part gets fitment-verified on a real car before it&rsquo;s tooled. These
            are next in line.
          </p>
          <Reveal delay={120} className="mt-8">
            <PipelineList products={pipeline} startIndex={available.length + 1} />
          </Reveal>
        </div>
      </section>

      {/* Request-a-part CTA */}
      <section aria-labelledby="cta-heading" className="blueprint-grid">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <RevealLines
            as="h2"
            className="mx-auto max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            lines={[
              <>Got an EK part that keeps</>,
              <>breaking and can&rsquo;t be bought?</>,
            ]}
          />
          <p className="mx-auto mt-4 max-w-xl text-ink-secondary">
            The pipeline is built from owner complaints, not guesses. If a discontinued
            part keeps failing on your car, that&rsquo;s exactly what belongs here.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
          >
            Suggest a part
          </Link>
        </div>
      </section>
    </>
  );
}
