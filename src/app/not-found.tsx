import Link from "next/link";
import { getAvailableProducts } from "@/lib/products";

export default function NotFound() {
  const available = getAvailableProducts();

  return (
    <section className="blueprint-grid">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          Error 404
        </p>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          This one really is No Longer Available.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-secondary">
          The page you asked for doesn&rsquo;t exist — wrong link, old URL, or a part
          that never had a page. The catalog is short enough that finding the real one
          won&rsquo;t take long.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
          >
            Browse all parts
          </Link>
          <Link
            href="/"
            className="border border-line-strong px-7 py-3.5 font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
          >
            Home
          </Link>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
            Available now
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {available.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-3.5 transition-colors hover:bg-bg-raised sm:px-3"
                >
                  <span className="text-sm text-ink-secondary transition-colors group-hover:text-ink">
                    {product.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-mono text-2xs text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
