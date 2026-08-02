import "server-only";
import Stripe from "stripe";
import { getColor } from "@/lib/colors";
import {
  getPartCost,
  orderEconomics,
  type OrderEconomics,
  type OrderLine,
} from "@/lib/economics";
import { getProduct } from "@/lib/products";

/*
 * Orders, read from Stripe.
 *
 * There is no orders database, and adding one would be a mistake. Stripe is
 * already the system of record for every fact this dashboard needs — what was
 * bought, for how much, when, by whom, where it ships, what the processing fee
 * actually was, whether the payment succeeded. A local table would have to be
 * kept in sync with all of that through webhooks, and the first time a webhook
 * is missed the dashboard starts lying about money. The reconciliation problem
 * is not worth taking on to save an API call.
 *
 * The one thing Stripe cannot know is what a part costs to produce. That comes
 * from data/costs.json and is joined here by product slug.
 *
 * `server-only` at the top is load-bearing: this module handles the secret key
 * and full customer addresses, and the import will fail the build rather than
 * ship either to a browser bundle.
 */

export type OpsLine = {
  slug: string | null;
  colorId: string;
  colorName: string;
  colorHex: string;
  variantId: string | null;
  name: string;
  qty: number;
  grossCents: number;
};

export type OpsOrder = {
  id: string;
  created: Date;
  status: "paid" | "unpaid" | "refunded";
  fulfilled: boolean;
  customerName: string | null;
  customerEmail: string | null;
  shipTo: string | null;
  lines: OpsLine[];
  economics: OrderEconomics;
};

export type OpsData =
  | { configured: false; reason: "no_key"; orders: never[] }
  | { configured: false; reason: "stripe_error"; message: string; orders: never[] }
  | { configured: true; orders: OpsOrder[]; livemode: boolean };

/*
 * The checkout route writes a manifest of `slug:variant:color:qty` onto the
 * session. Parsing that is exact, where parsing the human-readable line item
 * name would break the first time a product is renamed. Line items remain the
 * fallback for any order placed before the manifest existed.
 */
function parseManifest(manifest: string | undefined): Map<string, OpsLine> | null {
  if (!manifest) return null;
  const map = new Map<string, OpsLine>();

  for (const entry of manifest.split(",")) {
    const [slug, variantRaw, colorId, qtyRaw] = entry.split(":");
    const qty = Number(qtyRaw);
    if (!slug || !Number.isFinite(qty) || qty <= 0) continue;

    const product = getProduct(slug);
    const color = getColor(colorId);
    const variantId = variantRaw === "-" ? null : (variantRaw ?? null);
    const variantLabel = product?.variants?.find((v) => v.id === variantId)?.label;

    map.set(`${slug}:${variantId ?? "-"}:${color.id}`, {
      slug,
      colorId: color.id,
      colorName: color.name,
      colorHex: color.hex,
      variantId,
      name: [product?.name ?? slug, variantLabel].filter(Boolean).join(" — "),
      qty,
      grossCents: 0,
    });
  }

  return map.size > 0 ? map : null;
}

function formatAddress(address: Stripe.Address | null | undefined): string | null {
  if (!address) return null;
  return [address.line1, address.line2, address.city, address.state, address.postal_code]
    .filter(Boolean)
    .join(", ");
}

export async function getOrders(limit = 100): Promise<OpsData> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { configured: false, reason: "no_key", orders: [] };

  const stripe = new Stripe(secretKey);

  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: Math.min(limit, 100),
      // The line items and the real processing fee both need expanding, or
      // this would be N+1 round trips per order.
      expand: [
        "data.line_items",
        "data.payment_intent.latest_charge.balance_transaction",
        "data.customer_details",
      ],
    });

    const orders: OpsOrder[] = [];
    let livemode = false;

    for (const session of sessions.data) {
      // Abandoned checkouts are not orders. They are worth knowing about, but
      // not in a production queue, and counting them as revenue would be wrong.
      if (session.status === "open" || session.status === "expired") continue;
      livemode = livemode || session.livemode;

      const manifest = parseManifest(session.metadata?.manifest ?? undefined);
      const lines: OpsLine[] = [];

      for (const item of session.line_items?.data ?? []) {
        const grossCents = item.amount_total ?? 0;
        const qty = item.quantity ?? 1;
        const name = typeof item.description === "string" ? item.description : "Item";

        // Match the priced line back to the manifest entry so the colour is
        // authoritative rather than scraped out of the display name.
        const fromManifest = manifest
          ? [...manifest.values()].find((m) => m.qty === qty && name.startsWith(m.name))
          : undefined;

        if (fromManifest) {
          lines.push({ ...fromManifest, grossCents });
        } else {
          const fallbackColor = getColor(undefined);
          lines.push({
            slug: null,
            colorId: fallbackColor.id,
            colorName: fallbackColor.name,
            colorHex: fallbackColor.hex,
            variantId: null,
            name,
            qty,
            grossCents,
          });
        }
      }

      const paymentIntent =
        typeof session.payment_intent === "object" ? session.payment_intent : null;
      const charge =
        paymentIntent && typeof paymentIntent.latest_charge === "object"
          ? paymentIntent.latest_charge
          : null;
      const balanceTx =
        charge && typeof charge.balance_transaction === "object"
          ? charge.balance_transaction
          : null;

      // Stripe's actual fee where available, beating any estimate.
      const actualFee = balanceTx?.fee ?? null;
      const refunded = Boolean(charge?.refunded);

      const economicsLines: OrderLine[] = lines.map((l) => ({
        slug: l.slug,
        colorId: l.colorId,
        name: l.name,
        qty: l.qty,
        grossCents: l.grossCents,
      }));

      orders.push({
        id: session.id,
        created: new Date(session.created * 1000),
        status: refunded ? "refunded" : session.payment_status === "paid" ? "paid" : "unpaid",
        // Stripe's own fulfilment flag, set from its dashboard. It is the only
        // writable piece of state involved, and it lives there rather than
        // here so there is still exactly one system of record.
        fulfilled: session.status === "complete" && Boolean(session.metadata?.fulfilled),
        customerName: session.customer_details?.name ?? null,
        customerEmail: session.customer_details?.email ?? null,
        shipTo: formatAddress(
          session.collected_information?.shipping_details?.address ??
            session.customer_details?.address
        ),
        lines,
        economics: orderEconomics(
          economicsLines,
          session.amount_total ?? 0,
          session.shipping_cost?.amount_total ?? 0,
          actualFee,
          refunded
        ),
      });
    }

    orders.sort((a, b) => b.created.getTime() - a.created.getTime());
    return { configured: true, orders, livemode };
  } catch (error) {
    return {
      configured: false,
      reason: "stripe_error",
      message: error instanceof Error ? error.message : "Unknown Stripe error",
      orders: [],
    };
  }
}

/*
 * The production queue.
 *
 * Grouped by colour, not by order. Colour changeover is the expensive
 * operation — a hotend purge of material and machine time on every switch —
 * so the queue that minimises cost is the one that prints every black part,
 * then every graphite part, and so on. Sorting by order date instead would
 * mean a changeover between almost every part.
 */
export type QueueGroup = {
  colorId: string;
  colorName: string;
  colorHex: string;
  items: { name: string; slug: string | null; qty: number; orderIds: string[] }[];
  totalUnits: number;
  printMinutes: number;
};

export function buildQueue(orders: OpsOrder[]): QueueGroup[] {
  const pending = orders.filter((o) => o.status === "paid" && !o.fulfilled);
  const byColor = new Map<string, QueueGroup>();

  for (const order of pending) {
    for (const line of order.lines) {
      let group = byColor.get(line.colorId);
      if (!group) {
        group = {
          colorId: line.colorId,
          colorName: line.colorName,
          colorHex: line.colorHex,
          items: [],
          totalUnits: 0,
          printMinutes: 0,
        };
        byColor.set(line.colorId, group);
      }

      const existing = group.items.find((i) => i.name === line.name);
      if (existing) {
        existing.qty += line.qty;
        existing.orderIds.push(order.id);
      } else {
        group.items.push({
          name: line.name,
          slug: line.slug,
          qty: line.qty,
          orderIds: [order.id],
        });
      }
      group.totalUnits += line.qty;
    }
  }

  // Print minutes per group, so the day can be planned against machine hours.
  for (const group of byColor.values()) {
    for (const item of group.items) {
      if (!item.slug) continue;
      group.printMinutes += (getPartCost(item.slug)?.printMinutes ?? 0) * item.qty;
    }
  }

  // Biggest batch first: it is the one that best amortises its changeover.
  return [...byColor.values()].sort((a, b) => b.totalUnits - a.totalUnits);
}
