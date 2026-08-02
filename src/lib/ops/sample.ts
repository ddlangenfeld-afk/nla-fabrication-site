import "server-only";
import { getColor } from "@/lib/colors";
import { orderEconomics } from "@/lib/economics";
import type { OpsData, OpsLine, OpsOrder } from "@/lib/ops/orders";

/*
 * Synthetic orders, for `OPS_SAMPLE=1`.
 *
 * Two reasons this exists rather than being a throwaway test fixture:
 *
 *  - Before the first real sale, a correctly working dashboard and a broken
 *    one look identical: both are empty. Being able to see the populated
 *    layout — the colour batching, the margin maths, the queue ordering — is
 *    how you find out whether the numbers in costs.json describe a business
 *    that works, before you have taken anyone's money.
 *  - It is the only way to exercise the rendering path without a live Stripe
 *    key, which means it is what the layout is tested against.
 *
 * It is opt-in, it is never the fallback for a missing key, and the dashboard
 * carries a loud banner whenever it is on. A dashboard quietly showing
 * invented revenue would be worse than one showing nothing at all. Every
 * address is example.invalid / a reserved example address for the same reason.
 */

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

const LATCH = "glove-box-latch-96-00-civic";
const KNOBS = "hvac-slider-knob-set-96-98-civic";
const BEZEL = "door-handle-bezel-96-00-civic";

const NAMES: Record<string, string> = {
  [LATCH]: "Glove Box Latch & Handle",
  [KNOBS]: "HVAC Slider Lever & Knob Set",
  [BEZEL]: "Interior Door Handle Bezel",
};

const UNIT_CENTS: Record<string, number> = {
  [LATCH]: 2200,
  [KNOBS]: 1400,
  [BEZEL]: 1800,
};

function line(slug: string, colorId: string, qty: number, variantLabel?: string): OpsLine {
  const color = getColor(colorId);
  return {
    slug,
    colorId: color.id,
    colorName: color.name,
    colorHex: color.hex,
    variantId: variantLabel ? variantLabel.toLowerCase() : null,
    name: variantLabel ? `${NAMES[slug]} — ${variantLabel}` : NAMES[slug],
    qty,
    grossCents: UNIT_CENTS[slug] * qty,
  };
}

type Draft = {
  id: string;
  hours: number;
  lines: OpsLine[];
  shippingCents: number;
  fulfilled: boolean;
  status: OpsOrder["status"];
  name: string;
  email: string;
  shipTo: string;
};

/* A spread chosen to exercise the interesting cases rather than to look busy:
   a multi-colour order, a repeat colour across two orders (so the queue has
   something to batch), a shipped order, a refund, and one unfulfilled order
   old enough to look overdue. */
const DRAFTS: Draft[] = [
  {
    id: "cs_sample_01",
    hours: 2,
    lines: [line(LATCH, "black", 1), line(KNOBS, "black", 1)],
    shippingCents: 600,
    fulfilled: false,
    status: "paid",
    name: "Sample Buyer A",
    email: "a@example.invalid",
    shipTo: "1 Example Street, Springfield, IL, 62701",
  },
  {
    id: "cs_sample_02",
    hours: 7,
    lines: [line(BEZEL, "red", 2, "LH")],
    shippingCents: 600,
    fulfilled: false,
    status: "paid",
    name: "Sample Buyer B",
    email: "b@example.invalid",
    shipTo: "2 Example Avenue, Portland, OR, 97205",
  },
  {
    id: "cs_sample_03",
    hours: 21,
    lines: [line(LATCH, "black", 3)],
    shippingCents: 600,
    fulfilled: false,
    status: "paid",
    name: "Sample Buyer C",
    email: "c@example.invalid",
    shipTo: "3 Example Road, Austin, TX, 78701",
  },
  {
    id: "cs_sample_04",
    hours: 34,
    lines: [line(KNOBS, "graphite", 1), line(BEZEL, "graphite", 1, "RH")],
    shippingCents: 600,
    fulfilled: false,
    status: "paid",
    name: "Sample Buyer D",
    email: "d@example.invalid",
    shipTo: "4 Example Lane, Denver, CO, 80202",
  },
  {
    id: "cs_sample_05",
    hours: 74,
    lines: [line(LATCH, "sand", 1)],
    shippingCents: 600,
    fulfilled: true,
    status: "paid",
    name: "Sample Buyer E",
    email: "e@example.invalid",
    shipTo: "5 Example Court, Miami, FL, 33101",
  },
  {
    id: "cs_sample_06",
    hours: 120,
    lines: [line(BEZEL, "blue", 1, "LH")],
    shippingCents: 600,
    fulfilled: true,
    status: "refunded",
    name: "Sample Buyer F",
    email: "f@example.invalid",
    shipTo: "6 Example Way, Seattle, WA, 98101",
  },
  {
    id: "cs_sample_07",
    hours: 200,
    lines: [line(LATCH, "black", 2), line(KNOBS, "black", 2)],
    shippingCents: 600,
    fulfilled: true,
    status: "paid",
    name: "Sample Buyer G",
    email: "g@example.invalid",
    shipTo: "7 Example Plaza, Chicago, IL, 60601",
  },
];

export function sampleData(): OpsData {
  const orders: OpsOrder[] = DRAFTS.map((draft) => {
    const gross = draft.lines.reduce((n, l) => n + l.grossCents, 0) + draft.shippingCents;
    return {
      id: draft.id,
      created: hoursAgo(draft.hours),
      status: draft.status,
      fulfilled: draft.fulfilled,
      customerName: draft.name,
      customerEmail: draft.email,
      shipTo: draft.shipTo,
      lines: draft.lines,
      economics: orderEconomics(
        draft.lines.map((l) => ({
          slug: l.slug,
          colorId: l.colorId,
          name: l.name,
          qty: l.qty,
          grossCents: l.grossCents,
        })),
        gross,
        draft.shippingCents,
        null,
        draft.status === "refunded"
      ),
    };
  });

  return { configured: true, orders, livemode: false };
}
