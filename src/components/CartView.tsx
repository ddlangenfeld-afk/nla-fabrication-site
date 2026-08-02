"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";

type CheckoutState = "idle" | "submitting" | "error" | "not-configured";

export function CartSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading cart">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-5 border border-line bg-bg-raised p-5">
          <div className="h-20 w-28 shrink-0 animate-pulse bg-bg-overlay" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-1/2 animate-pulse bg-bg-overlay" />
            <div className="h-3 w-2/3 animate-pulse bg-bg-overlay" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartView() {
  const { items, ready, setQty, removeItem, subtotalCents, count } = useCart();
  const [checkout, setCheckout] = useState<CheckoutState>("idle");

  async function handleCheckout() {
    setCheckout("submitting");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data: { ok: boolean; url?: string; reason?: string } = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckout(data.reason === "not_configured" ? "not-configured" : "error");
    } catch {
      setCheckout("error");
    }
  }

  // The cart lives in localStorage, so the prerendered HTML can't know what's
  // in it — show a skeleton rather than flashing "empty".
  if (!ready) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="border border-line bg-bg-raised px-6 py-16 text-center">
        <p className="font-display text-xl font-semibold tracking-tight text-ink">
          Nothing in the cart yet.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-secondary">
          Three parts are available now, with more in fitment verification.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-block bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
        >
          Browse parts
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
      <div>
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const product = getProduct(item.slug);
            if (!product || product.priceCents == null) return null;
            const variantLabel = product.variants?.find(
              (v) => v.id === item.variantId
            )?.label;
            const lineKey = `${item.slug}-${item.variantId ?? "base"}`;

            return (
              <li key={lineKey} className="flex gap-4 py-5 sm:gap-6">
                <Link
                  href={`/products/${product.slug}`}
                  className="hidden w-28 shrink-0 self-start border border-line bg-bg-raised p-2 transition-colors hover:border-line-strong sm:block"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ProductArt
                    art={product.art}
                    title={product.name}
                    className="h-auto w-full"
                  />
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                        <Link
                          href={`/products/${product.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {product.name}
                        </Link>
                      </h2>
                      {variantLabel && (
                        <p className="mt-1 font-mono text-2xs uppercase tracking-wider text-accent">
                          {variantLabel}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-ink-secondary">{product.fitment}</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm text-ink">
                      {formatPrice(product.priceCents * item.qty)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => setQty(item.slug, item.variantId, item.qty - 1)}
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="flex h-9 w-9 items-center justify-center text-ink-secondary transition-colors hover:bg-bg-raised hover:text-ink"
                      >
                        −
                      </button>
                      <span className="flex h-9 min-w-9 items-center justify-center border-x border-line px-2 font-mono text-sm text-ink">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.slug, item.variantId, item.qty + 1)}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="flex h-9 w-9 items-center justify-center text-ink-secondary transition-colors hover:bg-bg-raised hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug, item.variantId)}
                      className="font-mono text-2xs uppercase tracking-wider text-ink-muted transition-colors hover:text-error"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p aria-live="polite" className="sr-only">
          Cart updated: {count} {count === 1 ? "item" : "items"}, subtotal{" "}
          {formatPrice(subtotalCents)}.
        </p>
      </div>

      <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-line-strong bg-bg-raised">
          <h2
            id="summary-heading"
            className="border-b border-line px-5 py-3 font-mono text-2xs uppercase tracking-widest text-ink-muted"
          >
            Order summary
          </h2>
          <dl className="space-y-3 px-5 py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-secondary">
                Subtotal ({count} {count === 1 ? "item" : "items"})
              </dt>
              <dd className="font-mono text-ink">{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Shipping</dt>
              <dd className="font-mono text-ink-muted">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-display text-lg font-semibold text-accent">
                {formatPrice(subtotalCents)}
              </dd>
            </div>
          </dl>

          <div className="border-t border-line p-5">
            {checkout === "not-configured" ? (
              <div className="border border-accent/40 bg-accent/10 p-4" role="alert">
                <p className="text-sm font-medium text-ink">Checkout isn&rsquo;t live yet.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  This deployment has no Stripe key configured, so no payment can be
                  taken. Add <code className="font-mono text-2xs">STRIPE_SECRET_KEY</code>{" "}
                  to enable it.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkout === "submitting"}
                  className="w-full bg-accent px-6 py-4 font-medium text-accent-ink transition-all hover:bg-accent-bright active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkout === "submitting" ? "Opening checkout…" : "Checkout"}
                </button>
                {checkout === "error" && (
                  <p role="alert" className="mt-3 text-sm text-error">
                    Couldn&rsquo;t start checkout. Try again in a moment — nothing was
                    charged.
                  </p>
                )}
              </>
            )}
            <p className="mt-4 font-mono text-2xs uppercase tracking-wider text-ink-muted">
              Secure payment via Stripe
            </p>
          </div>
        </div>

        <Link
          href="/shop"
          className="mt-5 block text-center font-mono text-2xs uppercase tracking-widest text-ink-secondary transition-colors hover:text-accent"
        >
          ← Keep shopping
        </Link>
      </aside>
    </div>
  );
}
