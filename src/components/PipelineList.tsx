import Link from "next/link";
import type { Product } from "@/lib/products";

/*
 * Pipeline parts are listed, not carded. Seven "coming soon" cards outweighed
 * the three parts that can actually be bought, and several pipeline items share
 * the same schematic — repeated side by side in a grid that reads as a bug.
 * A dense list keeps them scannable and keeps the emphasis on what's in stock.
 */
export function PipelineList({
  products,
  startIndex,
  showFitment = false,
}: {
  products: Product[];
  startIndex: number;
  showFitment?: boolean;
}) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {products.map((product, i) => (
        <li key={product.slug}>
          <Link
            href={`/products/${product.slug}`}
            className="group flex items-baseline gap-3 py-4 transition-colors hover:bg-bg-raised sm:gap-4 sm:px-4"
          >
            <span className="font-mono text-2xs text-ink-muted">
              {String(startIndex + i).padStart(3, "0")}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm text-ink-secondary transition-colors group-hover:text-ink sm:text-base">
                {product.name}
              </span>
              {showFitment && (
                <span className="mt-1 block text-xs text-ink-muted">{product.fitment}</span>
              )}
            </span>

            {/* The section heading already says these are in development, so the
                per-row label is redundant on small screens — and dropping it is
                what stops the longer part names from truncating. */}
            <span className="hidden shrink-0 font-mono text-2xs uppercase tracking-wider text-ink-muted sm:block">
              Coming soon
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 font-mono text-2xs text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
