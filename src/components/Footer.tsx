import Link from "next/link";
import { CONTACT_EMAIL, MARKETPLACES, SITE_NAME } from "@/lib/site";

type FooterLink = { href: string; label: string; external?: boolean };
type FooterColumn = { heading: string; links: FooterLink[] };

const footerColumns: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { href: "/shop", label: "All parts" },
      { href: "/products/glove-box-latch-96-00-civic", label: "Glove box latch" },
      { href: "/products/hvac-slider-knob-set-96-98-civic", label: "HVAC knob set" },
      { href: "/products/door-handle-bezel-96-00-civic", label: "Door handle bezel" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/shipping-returns", label: "Shipping & returns" },
    ],
  },
];

export function Footer() {
  /* The marketplace column only exists once a storefront URL is configured —
     see MARKETPLACES in lib/site.ts. An empty "Where to buy" heading is worse
     than no heading. */
  const columns: FooterColumn[] =
    MARKETPLACES.length > 0
      ? [
          ...footerColumns,
          {
            heading: "Where to buy",
            links: MARKETPLACES.map((m) => ({ href: m.url, label: m.label, external: true })),
          },
        ]
      : footerColumns;

  return (
    <footer className="border-t border-line bg-bg-inset">
      <div className="shell py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_repeat(3,1fr)] xl:grid-cols-[1.5fr_repeat(auto-fit,minmax(0,1fr))]">
          <div>
            <p className="font-display text-sm font-semibold tracking-tight text-ink">
              NLA<span className="text-accent">·</span>FABRICATION
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Reverse-engineered interior components for the 1996–2000 Civic (EK/EJ).
              Validated on the chassis. Produced to order.
            </p>
            <p className="mt-4 font-mono text-2xs uppercase tracking-widest text-ink-muted">
              Independent manufacturer — not affiliated with any vehicle manufacturer
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {/* Marketplace entries leave the site, so they render as a
                        plain anchor with rel set rather than a prefetching
                        <Link> pointed at another origin. */}
                    <LinkOrAnchor
                      href={link.href}
                      external={link.external}
                      // inline-block + padding gives a 25px tap target; the
                      // bare 17px line box failed WCAG 2.5.8.
                      className="link-underline inline-block py-1 text-sm text-ink-secondary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:text-ink motion-reduce:hover:translate-x-0"
                    >
                      {link.label}
                    </LinkOrAnchor>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-2xs text-ink-muted">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block py-1 font-mono text-2xs text-ink-muted transition-colors hover:text-ink-secondary"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}

function LinkOrAnchor({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
