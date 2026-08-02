import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
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
      {/* Hero */}
      <section className="blueprint-grid relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              EK · EJ · 1996–2000 Civic
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              The parts marked &ldquo;No&nbsp;Longer Available.&rdquo; Made&nbsp;available.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
              Precision 3D-printed reproductions of discontinued interior parts for the
              96–00 Civic — modeled from original geometry, printed in PETG, and shipped
              from a one-person shop that drives the same chassis.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
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

          {/* Spec title-block card */}
          <aside
            aria-label="Featured part specification"
            className="hidden self-start border border-line-strong bg-bg-raised lg:block"
          >
            <div className="border-b border-line p-6">
              <ProductArt
                art="latch"
                title="the glove box latch replacement"
                className="h-auto w-full"
              />
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
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Available now
              </p>
              <h2
                id="available-heading"
                className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
              >
                Three parts you can stop hunting for
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden shrink-0 font-mono text-xs uppercase tracking-widest text-ink-secondary transition-colors hover:text-accent sm:block"
            >
              All parts →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                index={allProducts.indexOf(product) + 1}
              />
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
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              Why these parts exist
            </p>
            <h2
              id="story-heading"
              className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl"
            >
              This shop exists because a glove box wouldn&rsquo;t stay shut.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-ink-secondary">
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
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-labelledby="pipeline-heading" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            In development
          </p>
          <h2
            id="pipeline-heading"
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            The pipeline
          </h2>
          <p className="mt-3 max-w-xl text-ink-secondary">
            Each part gets fitment-verified on a real car before it&rsquo;s tooled. These
            are next in line.
          </p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {pipeline.map((product, i) => (
              <li key={product.slug}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-4 transition-colors hover:bg-bg-raised sm:px-4"
                >
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="font-mono text-2xs text-ink-muted">
                      {String(i + 4).padStart(2, "0")}
                    </span>
                    <span className="truncate text-sm text-ink-secondary transition-colors group-hover:text-ink sm:text-base">
                      {product.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-2xs uppercase tracking-wider text-ink-muted">
                    Coming soon
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Request-a-part CTA */}
      <section aria-labelledby="cta-heading" className="blueprint-grid">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2
            id="cta-heading"
            className="mx-auto max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            Got an EK part that keeps breaking and can&rsquo;t be bought?
          </h2>
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
