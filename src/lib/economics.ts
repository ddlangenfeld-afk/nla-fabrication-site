import costs from "@/data/costs.json";

/*
 * Unit economics.
 *
 * Stripe knows what came in. It has no idea what a part costs to make, and it
 * never will — that number lives in a slicer and on a filament invoice. This
 * module is the join: Stripe's revenue and fees on one side, data/costs.json
 * on the other, matched by product slug.
 *
 * Everything is computed in whole cents. Money in floating point accumulates
 * error the moment you sum a column, and this file exists to be summed.
 */

export type PartCost = {
  grams: number;
  printMinutes: number;
  /** Bought-in parts at cost — LED bulbs and the like. Absent for anything
   *  that is purely printed, which is most of the catalog. */
  bomCostUsd?: number;
};

/* Variants of the same part can cost materially different amounts to make.
   The switch line's three tiers are 8g/30min, 24g/80min and 28g/90min plus an
   LED bulb set — treating them as one 24g part would understate the top tier
   and overstate the bottom one, and /ops exists precisely to not do that. */
type PartCostEntry = PartCost & { variants?: Record<string, PartCost | undefined> };

const PARTS = costs.parts as Record<string, PartCostEntry | undefined>;

export function getPartCost(slug: string, variantId?: string | null): PartCost | null {
  const entry = PARTS[slug];
  if (!entry) return null;
  const variant = variantId ? entry.variants?.[variantId] : undefined;
  // Falls back to the part-level figures rather than returning null: an
  // unrecognised variant should give an approximate margin, not blank out the
  // whole order's economics.
  return variant ?? entry;
}

/** True when every part in an order has a cost entry, so margins are real. */
export function hasCostModel(slug: string): boolean {
  return Boolean(PARTS[slug]);
}

const cents = (usd: number) => Math.round(usd * 100);

/** Material cost for one unit of a part, including the reprint allowance. */
export function materialCostCents(slug: string, variantId?: string | null): number {
  const part = getPartCost(slug, variantId);
  if (!part) return 0;
  const grams = part.grams * (1 + costs.failureAllowancePct / 100);
  const material = (grams / 1000) * cents(costs.materialCostPerKgUsd);
  // Bought-in parts carry no failure allowance — a spare LED is not a reprint.
  return Math.round(material + cents(part.bomCostUsd ?? 0));
}

/** Machine time for one unit — electricity and depreciation, not labour. */
export function machineCostCents(slug: string, variantId?: string | null): number {
  const part = getPartCost(slug, variantId);
  if (!part) return 0;
  return Math.round((part.printMinutes / 60) * cents(costs.machineCostPerHourUsd));
}

/** Everything charged once per order rather than per part. */
export function perOrderCostCents(): number {
  const labour = (costs.labourMinutesPerOrder / 60) * cents(costs.labourRatePerHourUsd);
  return Math.round(labour + cents(costs.packagingCostUsd) + cents(costs.shippingCostUsd));
}

/** The purge wasted on one colour switch. */
export function changeoverCostCents(): number {
  return Math.round(
    (costs.colorChangeoverGrams / 1000) * cents(costs.materialCostPerKgUsd)
  );
}

export function estimatedStripeFeeCents(grossCents: number): number {
  return Math.round(
    grossCents * (costs.stripePercentFee / 100) + cents(costs.stripeFixedFeeUsd)
  );
}

export type OrderLine = {
  slug: string | null;
  colorId: string | null;
  /** Needed for cost, not just for display — tiers differ in mass and BOM. */
  variantId?: string | null;
  name: string;
  qty: number;
  grossCents: number;
};

export type OrderEconomics = {
  grossCents: number;
  /** What the customer paid for shipping, as reported by Stripe. */
  shippingChargedCents: number;
  stripeFeeCents: number;
  materialCents: number;
  machineCents: number;
  /** Labour, packaging and postage — the per-order block. */
  overheadCents: number;
  /** Sum of everything it costs us. */
  totalCostCents: number;
  /** Gross minus fees minus all cost. What actually stays. */
  netCents: number;
  marginPct: number | null;
  /** Revenue was returned; net is the fee plus production cost, as a loss. */
  refunded: boolean;
  /** False when any line has no cost entry, so the margin is understated. */
  complete: boolean;
  printMinutes: number;
};

export function orderEconomics(
  lines: OrderLine[],
  grossCents: number,
  shippingChargedCents: number,
  actualStripeFeeCents: number | null,
  refunded = false
): OrderEconomics {
  let materialCents = 0;
  let machineCents = 0;
  let printMinutes = 0;
  let complete = true;

  for (const line of lines) {
    if (!line.slug || !hasCostModel(line.slug)) {
      complete = false;
      continue;
    }
    materialCents += materialCostCents(line.slug, line.variantId) * line.qty;
    machineCents += machineCostCents(line.slug, line.variantId) * line.qty;
    printMinutes += (getPartCost(line.slug, line.variantId)?.printMinutes ?? 0) * line.qty;
  }

  const stripeFeeCents = actualStripeFeeCents ?? estimatedStripeFeeCents(grossCents);
  const overheadCents = perOrderCostCents();
  const totalCostCents = materialCents + machineCents + overheadCents;

  /*
   * A refund is not a zero — it is a loss, and showing it as a positive net
   * was the bug this parameter fixes. The revenue goes back to the customer,
   * but Stripe does not return the processing fee on a refunded charge, and
   * the part was already printed, packed and posted. So a refunded order
   * costs the fee plus the full production cost, every time.
   */
  const netCents = refunded
    ? -(stripeFeeCents + totalCostCents)
    : grossCents - stripeFeeCents - totalCostCents;

  return {
    grossCents,
    shippingChargedCents,
    stripeFeeCents,
    materialCents,
    machineCents,
    overheadCents,
    totalCostCents,
    netCents,
    refunded,
    // A margin percentage on a refund is meaningless — there is no revenue to
    // take a percentage of.
    marginPct: !refunded && grossCents > 0 ? (netCents / grossCents) * 100 : null,
    complete,
    printMinutes,
  };
}

export const COST_ASSUMPTIONS = {
  materialCostPerKgUsd: costs.materialCostPerKgUsd,
  failureAllowancePct: costs.failureAllowancePct,
  colorChangeoverGrams: costs.colorChangeoverGrams,
  machineCostPerHourUsd: costs.machineCostPerHourUsd,
  labourRatePerHourUsd: costs.labourRatePerHourUsd,
  labourMinutesPerOrder: costs.labourMinutesPerOrder,
  packagingCostUsd: costs.packagingCostUsd,
  shippingCostUsd: costs.shippingCostUsd,
};

export function formatCents(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${(Math.abs(value) / 100).toFixed(2)}`;
}

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
