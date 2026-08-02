import type { Metadata } from "next";
import { OrderConfirmation, OrderNextSteps } from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order received",
  description: "Your order has been received.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <OrderConfirmation />
      <OrderNextSteps />
    </section>
  );
}
