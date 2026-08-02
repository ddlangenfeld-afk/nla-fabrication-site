import { NextResponse } from "next/server";
import Stripe from "stripe";
import { DEFAULT_COLOR_ID, getColor, isValidColorId } from "@/lib/colors";
import { DEFAULT_FACE_DESIGN_ID, getFaceDesign, isValidFaceDesignId } from "@/lib/faceDesigns";
import { getProduct } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

type CheckoutItem = {
  slug?: unknown;
  variantId?: unknown;
  colorId?: unknown;
  faceDesignId?: unknown;
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
  /* A compact manifest of what was actually bought, stored on the session.
     The ops dashboard reads this back to know which part, colour and face
     design to print — Stripe's own line item is a display name, and parsing
     production instructions out of a display string is how you end up
     printing the wrong thing the first time someone renames a product. */
  const manifest: string[] = [];

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

    // Colour never affects price — same resin, different masterbatch — so it
    // is validated against the palette and used for naming only. An unknown id
    // falls back to the default rather than failing the checkout.
    const colorId = isValidColorId(raw.colorId) ? raw.colorId : DEFAULT_COLOR_ID;
    const color = getColor(colorId);

    // Face design likewise never affects price — same print, different model
    // loaded first — and only matters for products that actually offer it.
    const faceDesignId =
      product.hasFaceDesigns && isValidFaceDesignId(raw.faceDesignId)
        ? raw.faceDesignId
        : DEFAULT_FACE_DESIGN_ID;
    const faceDesign = getFaceDesign(faceDesignId);

    const nameParts = [product.name];
    if (variantLabel) nameParts.push(variantLabel);
    // Only stated in the name when the product actually offers a choice —
    // otherwise every non-knob line would carry a meaningless "Classic Line".
    if (product.hasFaceDesigns) nameParts.push(faceDesign.name);
    nameParts.push(color.name);

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: {
          name: nameParts.join(" — "),
          description: product.fitment,
          // Survives onto the Stripe Product, so it is visible in Stripe's own
          // dashboard as well as ours.
          metadata: {
            slug,
            colorId,
            variantId: variantId ?? "",
            faceDesignId: product.hasFaceDesigns ? faceDesignId : "",
          },
        },
      },
    });

    manifest.push(
      [slug, variantId ?? "-", colorId, product.hasFaceDesigns ? faceDesignId : "-", qty].join(
        ":"
      )
    );
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ ok: false, reason: "empty_cart" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // A dedicated confirmation route, not a query flag on /cart: it keeps the
      // cart page free of a Suspense boundary, and gives the order a real URL.
      // Cancelling just returns them to their cart, which is left untouched.
      success_url: `${SITE_URL}/cart/success`,
      cancel_url: `${SITE_URL}/cart`,
      shipping_address_collection: { allowed_countries: ["US"] },
      // Stripe caps a metadata value at 500 characters. A cart long enough to
      // overflow that is far past anything this shop will see, but truncating
      // silently would corrupt the production queue, so it is capped
      // explicitly and the dashboard falls back to line items if it is absent.
      metadata: { manifest: manifest.join(",").slice(0, 500) },
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, reason: "session_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch {
    return NextResponse.json({ ok: false, reason: "session_failed" }, { status: 502 });
  }
}
