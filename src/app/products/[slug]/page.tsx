import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, getAllProducts, getProduct, type Product } from "@/lib/products";
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
    product.priceCents != null ? ` — ${formatPrice(product.priceCents)}` : " — Coming soon";

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

  if (product.oemRef) {
    base.mpn = product.oemRef;
    base.isSimilarTo = {
      "@type": "Product",
      name: `OEM part ${product.oemRef}`,
    };
  }

  base.offers = {
    "@type": "Offer",
    url: `${SITE_URL}/products/${product.slug}`,
    priceCurrency: "USD",
    price:
      product.priceCents != null ? (product.priceCents / 100).toFixed(2) : undefined,
    availability:
      product.status === "available"
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
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
    ...((product.color ? [["Finish", product.color]] : []) as [string, string][]),
    ["Status", comingSoon ? "In development" : "In stock — made to order"],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />

      <nav aria-label="Breadcrumb" className="border-b border-line">
        <ol className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 font-mono text-2xs uppercase tracking-wider text-ink-muted sm:px-6">
          <li>
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="transition-colors hover:text-accent">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-ink-secondary">{product.shortName}</li>
        </ol>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-16">
        {/* Drawing + spec table */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className={`blueprint-grid border border-line-strong bg-bg-raised p-6 ${
              comingSoon ? "opacity-50" : ""
            }`}
          >
            <ProductArt art={product.art} title={product.name} className="h-auto w-full" />
          </div>
          <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
            Technical drawing — photography and renders coming with first production run
          </p>

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
            {comingSoon ? "In development" : "Available now"}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-ink-secondary">{product.fitment}</p>

          {comingSoon ? (
            <div className="mt-8 border border-line bg-bg-raised p-6">
              <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                Not yet purchasable
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                {product.oemNote}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-block border border-line-strong px-6 py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
              >
                Ask to be told when it ships
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <p className="font-display text-3xl font-semibold text-accent">
                {formatPrice(product.priceCents!)}
                {product.hasVariants && (
                  <span className="ml-2 font-sans text-sm font-normal text-ink-muted">
                    per side
                  </span>
                )}
              </p>
              <div className="mt-6">
                <AddToCart product={product} />
              </div>
              <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
                Made to order · ships in 3–5 business days
              </p>
            </div>
          )}

          <div className="mt-10 space-y-4 border-t border-line pt-8 text-base leading-relaxed text-ink-secondary">
            {product.description.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>

          {product.features.length > 0 && (
            <div className="mt-8">
              <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                What you get
              </h2>
              <ul className="mt-4 space-y-2.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-ink-secondary">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 space-y-6 border-t border-line pt-8">
            <div>
              <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                Why it&rsquo;s here
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

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-line bg-bg-inset">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <h2
              id="related-heading"
              className="font-mono text-xs uppercase tracking-[0.18em] text-accent"
            >
              Also available
            </h2>
            {/* Only three parts are purchasable, so this row is always the
                other two — a two-up grid rather than a three-up with a hole. */}
            <div className="mt-6 grid max-w-3xl gap-5 sm:grid-cols-2">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} index={allProducts.indexOf(p) + 1} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
