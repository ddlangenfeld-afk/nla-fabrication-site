"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight text-ink transition-colors hover:text-accent"
        >
          NLA<span className="text-accent">·</span>FABRICATION
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`text-sm transition-colors hover:text-ink ${
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
  return (
    <Link
      href="/cart"
      className="group flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <span className="hidden sm:inline">Cart</span>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="sm:hidden">
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
        className={`flex h-5 min-w-5 items-center justify-center px-1 font-mono text-2xs transition-colors ${
          count > 0
            ? "bg-accent text-accent-ink"
            : "bg-bg-overlay text-ink-muted group-hover:text-ink-secondary"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
