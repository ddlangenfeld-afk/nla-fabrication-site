import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the parts in your cart and check out securely via Stripe.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <section className="border-b border-line bg-bg-inset">
        <div className="shell py-10 sm:py-12">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cart
          </h1>
        </div>
      </section>

      <section className="shell py-12 sm:py-14">
        <CartView />
      </section>
    </>
  );
}
