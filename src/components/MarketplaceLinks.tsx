import { MARKETPLACES } from "@/lib/site";

/*
 * Where else the catalog is listed.
 *
 * Renders nothing at all when no storefront URL is configured, so the section
 * appears the moment one is set in the environment and never ships as an empty
 * heading over a blank row in the meantime.
 */
export function MarketplaceLinks({ className = "" }: { className?: string }) {
  if (MARKETPLACES.length === 0) return null;

  return (
    <section aria-labelledby="marketplaces-heading" className={className}>
      <h2
        id="marketplaces-heading"
        className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
      >
        Also available through
      </h2>
      <ul className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {MARKETPLACES.map((market) => (
          <li key={market.id}>
            <a
              href={market.url}
              // Marketplace listings are a different site; open them in a new
              // tab so a half-filled cart here isn't lost. rel is required —
              // target="_blank" without it hands the new page a window.opener
              // reference back to this one.
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-center justify-between gap-4 bg-bg-raised px-5 py-4 transition-colors hover:bg-bg-overlay"
            >
              <span>
                <span className="block font-display text-base font-semibold text-ink transition-colors group-hover:text-accent">
                  {market.label}
                </span>
                <span className="mt-1 block text-sm text-ink-secondary">{market.note}</span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-xs text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
              >
                ↗
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
