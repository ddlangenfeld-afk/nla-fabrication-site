import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";
import { ProductArt } from "@/components/ProductArt";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const comingSoon = product.status === "coming-soon";
  const refLine = [
    `NLA-${String(index).padStart(3, "0")}`,
    product.oemRef ? `REF ${product.oemRef}` : null,
    product.hasVariants ? "LH / RH" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex flex-col border border-line bg-bg-raised transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-mono text-2xs uppercase tracking-wider text-ink-muted">{refLine}</p>
        {comingSoon ? (
          <p className="border border-line-strong px-2 py-0.5 font-mono text-2xs uppercase tracking-wider text-ink-muted">
            Coming soon
          </p>
        ) : (
          <p className="bg-accent/10 px-2 py-0.5 font-mono text-2xs uppercase tracking-wider text-accent">
            In stock
          </p>
        )}
      </div>

      <div className={`px-5 pt-5 ${comingSoon ? "opacity-45" : ""}`}>
        <ProductArt art={product.art} title={product.name} className="h-auto w-full" />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-accent-bright"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-secondary">{product.fitment}</p>
        <div className="mt-auto flex items-baseline justify-between pt-4">
          {comingSoon ? (
            <p className="font-mono text-sm text-ink-muted">In development</p>
          ) : (
            <p className="font-mono text-base text-accent">
              {formatPrice(product.priceCents!)}
              {product.hasVariants && (
                <span className="text-2xs text-ink-muted"> / side</span>
              )}
            </p>
          )}
          <span
            aria-hidden="true"
            className="font-mono text-xs text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
          >
            →
          </span>
        </div>
      </div>
    </article>
  );
}
