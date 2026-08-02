"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useHeaderScroll } from "@/lib/motion";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, stuck } = useHeaderScroll();

  // Never retract while the mobile menu is open — the bar would take the menu
  // with it and leave the toggle unreachable.
  const retracted = hidden && !menuOpen;

  return (
    <header
      data-hidden={retracted}
      className={`sticky top-0 z-40 border-b transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        retracted ? "-translate-y-full" : "translate-y-0"
      } ${
        stuck || menuOpen
          ? "border-line bg-bg/70 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="shell flex h-[72px] items-center justify-between">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="hover-lift inline-block py-2 font-display text-base font-semibold tracking-tight text-ink hover:text-accent"
        >
          NLA<span className="text-accent">·</span>FABRICATION
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              // py-2 takes the tap target past the 24px WCAG 2.5.8 minimum;
              // the 17px line box alone was under it.
              className={`hover-lift link-underline inline-block py-2 text-sm hover:text-ink ${
                pathname.startsWith(link.href) ? "text-ink" : "text-ink-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <CartLink count={ready ? count : 0} />
        </nav>

        <div className="flex items-center gap-4 sm:hidden">
          <CartLink count={ready ? count : 0} />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main menu"
          className="border-t border-line bg-bg sm:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className="block border-b border-line px-4 py-4 text-sm text-ink-secondary transition-colors hover:bg-bg-raised hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function CartLink({ count }: { count: number }) {
  /*
   * No aria-label on the link itself. Overriding the whole name broke WCAG
   * 2.5.3 (Label in Name): the visible text is "Cart" plus the badge digit,
   * which "Cart, 0 items" doesn't contain, so voice-control users saying
   * "click Cart 2" could miss. Instead the digit is hidden from the name and
   * the count is supplied as screen-reader-only text, so the accessible name
   * ends up "Cart, 2 items" while still containing the visible label.
   */
  return (
    <Link
      href="/cart"
      className="hover-lift group flex items-center gap-2 py-2 text-sm text-ink-secondary hover:text-ink"
    >
      <span className="hidden sm:inline">Cart</span>
      <span className="sr-only sm:hidden">Cart</span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className="sm:hidden"
      >
        <path
          d="M2 3h2l1.6 8.5a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.8L16 6H5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="15.5" r="1.1" fill="currentColor" />
        <circle cx="13" cy="15.5" r="1.1" fill="currentColor" />
      </svg>
      <span
        aria-hidden="true"
        className={`flex h-5 min-w-5 items-center justify-center px-1 font-mono text-2xs transition-colors ${
          count > 0
            ? "bg-accent text-accent-ink"
            : "bg-bg-overlay text-ink-muted group-hover:text-ink-secondary"
        }`}
      >
        {count}
      </span>
      <span className="sr-only">
        , {count} {count === 1 ? "item" : "items"}
      </span>
    </Link>
  );
}
