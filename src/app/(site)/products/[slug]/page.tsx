import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { ProductViewer } from "@/components/ProductViewer";
import { Reveal } from "@/components/Reveal";
import { COLORS } from "@/lib/colors";
import { designsFor } from "@/lib/faceDesigns";
import { GlyphSelectionProvider } from "@/lib/glyphSelection";
import {
  formatPriceRange,
  getAllProducts,
  getProduct,
  hasPriceLadder,
  priceRangeCents,
  type Product,
} from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Part not found" };

  const priceLabel =
    product.priceCents != null ? ` — ${formatPriceRange(product)}` : " — Coming soon";

  return {
    title: `${product.name} — ${product.fitmentYears} Civic ${product.chassis.join("/")}`,
    description: `${product.description[0].slice(0, 150)}`.trim(),
    keywords: product.keywords,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name}${priceLabel}`,
      description: product.description[0],
      url: `${SITE_URL}/products/${product.slug}`,
      type: "website",
    },
  };
}

function productJsonLd(product: Product) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.join(" "),
    url: `${SITE_URL}/products/${product.slug}`,
    sku: `NLA-${product.slug}`,
    material: product.material,
    brand: { "@type": "Brand", name: SITE_NAME },
    isRelatedTo: `${product.fitment}`,
  };

  // Deliberately NOT `mpn`. The OEM reference is the part this replaces, not
  // the manufacturer part number of the thing being sold — publishing it as
  // `mpn` under our own `brand` asserts that this IS the OEM part. It is not.
  // `isSimilarTo` is the correct relationship for "replaces / interchanges with".
  if (product.oemRef) {
    base.isSimilarTo = {
      "@type": "Product",
      name: `OEM part ${product.oemRef}`,
    };
  }

  const availability =
    product.status === "available"
      ? "https://schema.org/InStock"
      : "https://schema.org/PreOrder";
  const range = priceRangeCents(product);

  /* A product whose variants span $19-$59 has to be published as an
     AggregateOffer. Emitting a single `price` for it would state one number as
     THE price to every aggregator that reads this, which is the structured-data
     equivalent of the scarcity copy — technically parseable, factually wrong. */
  base.offers =
    range && range[0] !== range[1]
      ? {
          "@type": "AggregateOffer",
          url: `${SITE_URL}/products/${product.slug}`,
          priceCurrency: "USD",
          lowPrice: (range[0] / 100).toFixed(2),
          highPrice: (range[1] / 100).toFixed(2),
          offerCount: product.variants?.length ?? 1,
          availability,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: SITE_NAME },
        }
      : {
          "@type": "Offer",
          url: `${SITE_URL}/products/${product.slug}`,
          priceCurrency: "USD",
          price: range ? (range[0] / 100).toFixed(2) : undefined,
          availability,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: SITE_NAME },
        };

  return base;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const allProducts = getAllProducts();
  const index = allProducts.indexOf(product) + 1;
  const comingSoon = product.status === "coming-soon";
  const related = allProducts
    .filter((p) => p.slug !== product.slug && p.status === "available")
    .slice(0, 3);

  const specs: [string, string][] = [
    ["Part no.", `NLA-${String(index).padStart(3, "0")}`],
    ...((product.oemRef ? [["OEM ref.", product.oemRef]] : []) as [string, string][]),
    ["Fitment", product.fitment],
    ["Chassis", product.chassis.join(" / ")],
    ["Material", product.material],
    // The static "Finish" field is replaced by the palette: the picker in the
    // buy column is the live one, and this states the range on the spec sheet.
    ["Finish", comingSoon ? (product.color ?? "TBC") : `${COLORS.length} standard`],
    ...((product.hasFaceDesigns
      ? [
          product.glyphSurface === "aperture"
            ? // No "Classic +" here: the classic single line is not one of the
              // options on an aperture product, so counting from it would
              // advertise a choice this page does not offer.
              ["Symbol", `${designsFor("aperture").length} designs`]
            : ["Face design", `Classic + ${designsFor("knob").length - 1} designs`],
        ]
      : []) as [string, string][]),
    ["Status", comingSoon ? "In engineering" : "In production — made to order"],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />

      <nav aria-label="Breadcrumb" className="border-b border-line">
        <ol className="shell flex items-center gap-2 py-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
          <li>
            <Link href="/" className="link-underline inline-block transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="link-underline inline-block transition-colors hover:text-accent">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-ink-secondary">{product.shortName}</li>
        </ol>
      </nav>

      {/* Both columns sit inside the provider: the picker is in the buy column
          and the artwork is in the sticky column opposite, and one selection
          has to drive both. See lib/glyphSelection.tsx. */}
      <GlyphSelectionProvider surface={product.glyphSurface}>
        <div className="shell grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-16">
          {/* Drawing + spec table */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductViewer product={product} dimmed={comingSoon} />

            <dl className="mt-6 border border-line">
              {specs.map(([term, detail]) => (
                <div
                  key={term}
                  className="grid grid-cols-[104px_1fr] border-b border-line last:border-b-0 sm:grid-cols-[128px_1fr]"
                >
                  <dt className="border-r border-line px-3 py-2.5 font-mono text-2xs uppercase tracking-wider text-ink-muted sm:px-4">
                    {term}
                  </dt>
                  <dd className="px-3 py-2.5 font-mono text-2xs tracking-wide text-ink-secondary sm:px-4">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Sits with the spec table rather than under the buy column: it's a
                statement about the part numbers above it, and it fills what was
                otherwise a tall empty gap beside the description on desktop. */}
            <p className="mt-6 text-xs leading-relaxed text-ink-muted">
              Aftermarket reproduction part manufactured by {SITE_NAME}. Not an original
              manufacturer part and not affiliated with, sponsored by, or endorsed by any
              vehicle manufacturer. OEM part numbers are referenced solely to identify
              compatibility.
            </p>
          </div>

          {/* Buy column */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              {comingSoon ? "In engineering" : "In production"}
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-ink-secondary">{product.fitment}</p>

            {comingSoon ? (
              <div className="mt-8 border border-line bg-bg-raised p-6">
                <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                  Not yet released
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                  {product.oemNote}
                </p>
                <Link
                  href="/contact"
                  className="mt-5 inline-block border border-line-strong px-6 py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
                >
                  Request release notification
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                {/* A ladder shows its range here and the exact figure on each
                     tier button below, rather than duplicating a live price that
                     would then need client state in a server component. */}
                <p className="font-display text-3xl font-semibold text-accent">
                  {formatPriceRange(product)}
                  {product.hasVariants && (
                    <span className="ml-2 font-sans text-sm font-normal text-ink-muted">
                      {hasPriceLadder(product) ? "by specification" : "per side"}
                    </span>
                  )}
                </p>
                <div className="mt-6">
                  <AddToCart product={product} />
                </div>
                <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
                  Produced to order · dispatch in 3–5 business days
                </p>
              </div>
            )}

            <div className="mt-10 space-y-4 border-t border-line pt-8 text-base leading-relaxed text-ink-secondary">
              {product.description.map((para, i) => (
                <Reveal as="p" key={para.slice(0, 24)} delay={i * 90}>
                  {para}
                </Reveal>
              ))}
            </div>

            {product.features.length > 0 && (
              <div className="mt-8">
                <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                  Specification
                </h2>
                <ul className="mt-4 space-y-1">
                  {product.features.map((feature, i) => (
                    <Reveal
                      as="li"
                      key={feature}
                      delay={i * 80}
                      className="-mx-2 flex gap-3 px-2 py-1.5 text-sm text-ink-secondary transition-colors hover:text-ink"
                    >
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                      {feature}
                    </Reveal>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 space-y-6 border-t border-line pt-8">
              <div>
                <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                  Why it&rsquo;s in the catalog
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                  {product.oemNote}
                </p>
              </div>
              {product.materialNote && (
                <div>
                  <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                    Material
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                    {product.materialNote}
                  </p>
                </div>
              )}
              {product.installNote && (
                <div>
                  <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                    Installation
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                    {product.installNote}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </GlyphSelectionProvider>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-line bg-bg-inset">
          <div className="shell py-14 sm:py-16">
            <h2
              id="related-heading"
              className="font-mono text-xs uppercase tracking-[0.18em] text-accent"
            >
              Also in production
            </h2>
            {/* Only three parts are purchasable, so this row is always the
                other two — a two-up grid rather than a three-up with a hole. */}
            <div className="mt-6 grid max-w-3xl gap-5 sm:grid-cols-2">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 110} className="flex">
                  <ProductCard product={p} index={allProducts.indexOf(p) + 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
