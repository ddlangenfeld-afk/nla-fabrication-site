"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export function OrderConfirmation() {
  // The order belongs to Stripe now — drop the local copy so a refresh or a
  // later visit doesn't re-offer parts that were just bought.
  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="border border-success/40 bg-success/10 p-8">
      <p className="font-mono text-2xs uppercase tracking-widest text-success">
        Payment complete
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
        Order received.
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-ink-secondary">
        Thanks — a confirmation is on its way to the email you gave Stripe. Parts are
        printed to order, so expect 3–5 business days before yours ships.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
        >
          Back to the catalog
        </Link>
        <Link
          href="/contact"
          className="border border-line-strong px-7 py-3.5 font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
        >
          Question about this order
        </Link>
      </div>
    </div>
  );
}
