import type { Metadata } from "next";
import { PipelineList } from "@/components/PipelineList";
import { MarketplaceLinks } from "@/components/MarketplaceLinks";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getAllProducts, getAvailableProducts, getComingSoonProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop — 96–00 Civic EK/EJ Interior Parts",
  description:
    "The full NLA Fabrication catalog for the 1996–2000 Civic (EK/EJ): glove box latch, HVAC slider knobs and interior door handle bezel, plus components currently in engineering.",
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
        {/* Two columns from xl: the counts move up beside the intro instead of
            stacking under it, which is what left the right half of a wide
            display empty. */}
        <div className="shell grid gap-8 py-12 sm:py-16 xl:grid-cols-[1.4fr_1fr] xl:items-end xl:gap-16">
          <div>
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
              Every component in this catalog was selected against a documented failure
              on the 96–00 Civic with no new replacement available from any source.
              Fitment is listed per part; interior components are produced in
              engineering-grade PETG unless otherwise specified.
            </p>
          </div>
          <dl
            className="hero-in flex flex-wrap gap-x-10 gap-y-4 xl:justify-end"
            style={{ "--hero-delay": "280ms" } as React.CSSProperties}
          >
            {[
              [available.length, "in production"],
              [pipeline.length, "in engineering"],
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

      <Reveal className="shell pb-4">
        <MarketplaceLinks />
      </Reveal>

      <section aria-labelledby="pipeline-heading" className="border-t border-line bg-bg-inset">
        <div className="shell py-14 sm:py-16">
          <Reveal
            as="h2"
            id="pipeline-heading"
            className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted"
          >
            In engineering — not yet released
          </Reveal>
          <Reveal as="p" delay={90} className="mt-3 max-w-2xl text-sm text-ink-secondary">
            Each of these requires fitment validation on the chassis before it is tooled
            and released. We do not take pre-orders — components list when they pass.
          </Reveal>
          <Reveal delay={160} className="mt-8">
            <PipelineList products={pipeline} startIndex={available.length + 1} showFitment />
          </Reveal>
        </div>
      </section>
    </>
  );
}
