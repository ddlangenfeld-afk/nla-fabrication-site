import type { Metadata } from "next";
import { PipelineList } from "@/components/PipelineList";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getAllProducts, getAvailableProducts, getComingSoonProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop — Discontinued 96–00 Civic EK/EJ Parts",
  description:
    "Every NLA Fabrication part for the 1996–2000 Civic (EK/EJ): glove box latch, HVAC slider knobs, interior door handle bezel, plus the parts currently in development.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const allProducts = getAllProducts();
  const available = getAvailableProducts();
  const pipeline = getComingSoonProducts();

  return (
    <>
      {/* Above the fold: CSS-only entrance, no observer, so the h1 doesn't
          wait on hydration to paint. */}
      <section className="glow-band border-b border-line bg-bg-inset">
        <div className="shell py-12 sm:py-16">
          <p className="hero-in font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Catalog
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            <span className="hero-line">
              <span style={{ "--hero-delay": "60ms" } as React.CSSProperties}>All parts</span>
            </span>
          </h1>
          <p
            className="hero-in mt-4 max-w-2xl text-ink-secondary"
            style={{ "--hero-delay": "200ms" } as React.CSSProperties}
          >
            Every part here was chosen because it&rsquo;s a documented failure point on the
            96–00 Civic with no new replacement available. Fitment listed per part; all
            interior parts print in PETG unless noted.
          </p>
          <dl
            className="hero-in mt-8 flex flex-wrap gap-x-10 gap-y-4"
            style={{ "--hero-delay": "280ms" } as React.CSSProperties}
          >
            {[
              [available.length, "available now"],
              [pipeline.length, "in development"],
              ["PETG", "standard material"],
            ].map(([value, label]) => (
              <div key={String(label)}>
                <dd className="font-display text-2xl font-semibold text-ink">{value}</dd>
                <dt className="mt-0.5 font-mono text-2xs uppercase tracking-widest text-ink-muted">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="available-heading">
        <div className="shell py-14 sm:py-16">
          <Reveal
            as="h2"
            id="available-heading"
            className="font-mono text-xs uppercase tracking-[0.18em] text-accent"
          >
            Available now
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((product, i) => (
              <Reveal key={product.slug} delay={i * 110} className="flex">
                <ProductCard product={product} index={allProducts.indexOf(product) + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="pipeline-heading" className="border-t border-line bg-bg-inset">
        <div className="shell py-14 sm:py-16">
          <Reveal
            as="h2"
            id="pipeline-heading"
            className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
          >
            In development — not yet purchasable
          </Reveal>
          <Reveal as="p" delay={90} className="mt-3 max-w-2xl text-sm text-ink-secondary">
            Each of these needs fitment verification on a real car before it gets modeled
            and tooled. No pre-orders — they go live when they fit.
          </Reveal>
          <Reveal delay={160} className="mt-8">
            <PipelineList products={pipeline} startIndex={available.length + 1} showFitment />
          </Reveal>
        </div>
      </section>
    </>
  );
}
