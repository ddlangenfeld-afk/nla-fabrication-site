import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const footerColumns = [
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
  return (
    <footer className="border-t border-line bg-bg-inset">
      <div className="shell py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-sm font-semibold tracking-tight text-ink">
              NLA<span className="text-accent">·</span>FABRICATION
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Reproduction parts for the 1996–2000 Civic (EK/EJ) that the factory no
              longer makes. Modeled from original geometry. Printed to fit.
            </p>
            <p className="mt-4 font-mono text-2xs uppercase tracking-widest text-ink-muted">
              Independent shop — not affiliated with any vehicle manufacturer
            </p>
          </div>
          {footerColumns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      // inline-block + padding gives a 25px tap target; the
                      // bare 17px line box failed WCAG 2.5.8.
                      className="inline-block py-1 text-sm text-ink-secondary transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
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
