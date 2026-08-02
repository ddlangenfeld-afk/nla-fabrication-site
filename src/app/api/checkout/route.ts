import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

type CheckoutItem = {
  slug?: unknown;
  variantId?: unknown;
  qty?: unknown;
};

export async function POST(request: Request) {
  let body: { items?: CheckoutItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ ok: false, reason: "empty_cart" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const raw of rawItems) {
    const slug = typeof raw.slug === "string" ? raw.slug : null;
    const qty =
      typeof raw.qty === "number" && Number.isFinite(raw.qty)
        ? Math.min(Math.max(Math.round(raw.qty), 1), 99)
        : null;
    if (!slug || !qty) continue;

    const product = getProduct(slug);
    if (!product || product.status !== "available" || product.priceCents == null) continue;

    const variantId = typeof raw.variantId === "string" ? raw.variantId : undefined;
    const variantLabel = product.variants?.find((v) => v.id === variantId)?.label;

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: {
          name: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
          description: product.fitment,
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ ok: false, reason: "empty_cart" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${SITE_URL}/cart?success=1`,
      cancel_url: `${SITE_URL}/cart?canceled=1`,
      shipping_address_collection: { allowed_countries: ["US"] },
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, reason: "session_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch {
    return NextResponse.json({ ok: false, reason: "session_failed" }, { status: 502 });
  }
}
