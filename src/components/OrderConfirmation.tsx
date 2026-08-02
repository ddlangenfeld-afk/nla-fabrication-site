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

/*
 * Numbered because this genuinely is a sequence — each step waits on the one
 * before it. Setting the expectation here is what stops "where is my order"
 * arriving on day two of a print queue.
 */
const steps = [
  {
    n: "01",
    when: "Now",
    title: "Confirmation email",
    body: "Stripe sends a receipt to the address you checked out with. That address is also how an order gets looked up later.",
  },
  {
    n: "02",
    when: "3–5 business days",
    title: "Your part gets printed",
    body: "Nothing is sitting on a shelf — every part is printed to order, inspected, and test-fitted before it goes in a box.",
  },
  {
    n: "03",
    when: "After printing",
    title: "Shipped with tracking",
    body: "A tracking number follows by email as soon as the label is made.",
  },
];

export function OrderNextSteps() {
  return (
    <section aria-labelledby="next-steps" className="mt-14">
      <h2
        id="next-steps"
        className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
      >
        What happens next
      </h2>
      <ol className="mt-6 border-t border-line">
        {steps.map((step) => (
          <li
            key={step.n}
            className="grid gap-x-6 gap-y-1 border-b border-line py-5 sm:grid-cols-[auto_1fr_auto] sm:items-baseline"
          >
            <span className="font-mono text-2xs text-accent">{step.n}</span>
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-secondary">
                {step.body}
              </p>
            </div>
            <span className="font-mono text-2xs uppercase tracking-wider text-ink-muted sm:text-right">
              {step.when}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
