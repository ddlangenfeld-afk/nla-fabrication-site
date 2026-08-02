import type { Metadata } from "next";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import { buildQueue, getOrders } from "@/lib/ops/orders";
import { sampleData } from "@/lib/ops/sample";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false, nocache: true },
};

/*
 * Never cached, never prerendered. The whole point is what is true right now,
 * and a cached production queue is a queue that tells you to print something
 * you already shipped.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpsPage() {
  /* Opt-in only, and deliberately not a fallback for a missing Stripe key —
     a dashboard that silently invents revenue when it can't reach Stripe is
     worse than one that says it can't reach Stripe. */
  const sample = process.env.OPS_SAMPLE === "1";
  const data = sample ? sampleData() : await getOrders();
  const queue = data.configured ? buildQueue(data.orders) : [];

  return <OpsDashboard data={data} queue={queue} sample={sample} />;
}
