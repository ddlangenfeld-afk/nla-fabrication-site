import Link from "next/link";
import { KnobFaceIcon } from "@/components/KnobFaceIcon";
import {
  changeoverCostCents,
  COST_ASSUMPTIONS,
  formatCents,
  formatHours,
} from "@/lib/economics";
import type { OpsData, OpsOrder, QueueGroup } from "@/lib/ops/orders";

/*
 * The operations dashboard.
 *
 * Not a marketing page — an instrument panel. Density over whitespace, the
 * number over the label, no animation. It answers three questions in the order
 * they get asked on a working day:
 *
 *   1. What do I print today, and in what order?
 *   2. Did I actually make money on what has already gone out?
 *   3. What is the state of every individual order?
 */

const DAY = 24 * 60 * 60 * 1000;

function isWithin(order: OpsOrder, days: number) {
  return Date.now() - order.created.getTime() <= days * DAY;
}

function sumEconomics(orders: OpsOrder[]) {
  return orders.reduce(
    (acc, order) => {
      acc.gross += order.economics.grossCents;
      acc.fees += order.economics.stripeFeeCents;
      acc.material += order.economics.materialCents;
      acc.machine += order.economics.machineCents;
      acc.overhead += order.economics.overheadCents;
      acc.net += order.economics.netCents;
      acc.shippingCharged += order.economics.shippingChargedCents;
      acc.count += 1;
      return acc;
    },
    {
      gross: 0,
      fees: 0,
      material: 0,
      machine: 0,
      overhead: 0,
      net: 0,
      shippingCharged: 0,
      count: 0,
    }
  );
}

export function OpsDashboard({
  data,
  queue,
  sample = false,
}: {
  data: OpsData;
  queue: QueueGroup[];
  sample?: boolean;
}) {
  if (!data.configured) {
    return <NotConfigured data={data} />;
  }

  const { orders, livemode } = data;
  const paid = orders.filter((o) => o.status === "paid");
  const pending = paid.filter((o) => !o.fulfilled);

  const queueUnits = queue.reduce((n, g) => n + g.totalUnits, 0);
  const queueMinutes = queue.reduce((n, g) => n + g.printMinutes, 0);
  // One changeover per colour group beyond the first — the first colour is
  // whatever is already loaded.
  const changeovers = Math.max(0, queue.length - 1);

  const last7 = sumEconomics(paid.filter((o) => isWithin(o, 7)));
  const last30 = sumEconomics(paid.filter((o) => isWithin(o, 30)));
  const allTime = sumEconomics(paid);

  return (
    <div className="shell py-8">
      {sample && (
        /* Loud on purpose. Someone glancing at this page must never mistake
           fixture numbers for their actual takings. */
        <p
          role="status"
          className="mb-6 border-2 border-accent bg-accent/15 px-4 py-3 text-center font-mono text-2xs uppercase tracking-widest text-accent"
        >
          Sample data — these are not real orders. Unset OPS_SAMPLE to read Stripe.
        </p>
      )}
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Operations
          </h1>
          <p className="mt-1 font-mono text-2xs uppercase tracking-widest text-ink-muted">
            {new Date().toLocaleString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Test-mode data looks exactly like real data, and mistaking one for
              the other is the single easiest way to misread this page. */}
          <span
            className={`px-2.5 py-1 font-mono text-2xs uppercase tracking-widest ${
              livemode ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
            }`}
          >
            {livemode ? "Live mode" : "Test mode"}
          </span>
          <Link
            href="/"
            className="font-mono text-2xs uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
          >
            ← Site
          </Link>
        </div>
      </header>

      {/* ---- 1. Today ---- */}
      <section aria-labelledby="queue-heading" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="queue-heading" className="font-display text-lg font-semibold text-ink">
            Production queue
          </h2>
          <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
            {pending.length} order{pending.length === 1 ? "" : "s"} · {queueUnits} unit
            {queueUnits === 1 ? "" : "s"} · {formatHours(queueMinutes)} machine time
            {changeovers > 0 &&
              ` · ${changeovers} colour change${changeovers === 1 ? "" : "s"} (${formatCents(
                changeovers * changeoverCostCents()
              )} purged)`}
          </p>
        </div>

        {queue.length === 0 ? (
          <p className="mt-4 border border-line bg-bg-raised px-5 py-8 text-center text-sm text-ink-secondary">
            Nothing waiting to print. Every paid order is marked fulfilled.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-secondary">
              Grouped by colour and ordered largest batch first. Print top to bottom and
              the machine changes colour {changeovers} time{changeovers === 1 ? "" : "s"};
              working order by order instead would change it on almost every part.
            </p>
            <div className="mt-5 space-y-4">
              {queue.map((group) => (
                <div key={group.colorId} className="border border-line bg-bg-raised">
                  <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 border border-line-strong"
                        style={{ background: group.colorHex }}
                      />
                      <span className="font-display text-base font-semibold text-ink">
                        {group.colorName}
                      </span>
                    </div>
                    <span className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                      {group.totalUnits} unit{group.totalUnits === 1 ? "" : "s"} ·{" "}
                      {formatHours(group.printMinutes)}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {group.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-4 px-4 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm text-ink">
                          {item.faceDesignId && (
                            <KnobFaceIcon
                              id={item.faceDesignId}
                              className="h-4 w-4 shrink-0 text-ink-muted"
                            />
                          )}
                          {item.name}
                        </span>
                        <span className="shrink-0 font-mono text-sm text-accent">
                          ×{item.qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- 2. Money ---- */}
      <section aria-labelledby="money-heading" className="mt-12">
        <h2 id="money-heading" className="font-display text-lg font-semibold text-ink">
          Margin
        </h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Revenue and processing fees come from Stripe. Production cost is computed from{" "}
          <code className="font-mono text-2xs text-ink">data/costs.json</code> — those are
          estimates until you weigh a real part and read a real print time.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            ["Last 7 days", last7],
            ["Last 30 days", last30],
            ["All time", allTime],
          ].map(([label, totals]) => {
            const t = totals as ReturnType<typeof sumEconomics>;
            const margin = t.gross > 0 ? (t.net / t.gross) * 100 : null;
            return (
              <div key={String(label)} className="border border-line bg-bg-raised p-5">
                <p className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
                  {String(label)} · {t.count} order{t.count === 1 ? "" : "s"}
                </p>
                <p className="mt-3 font-display text-3xl font-semibold text-ink">
                  {formatCents(t.gross)}
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
                  <Row label="Stripe fees" value={-t.fees} />
                  <Row label="Material" value={-t.material} />
                  <Row label="Machine time" value={-t.machine} />
                  <Row label="Labour, packaging, postage" value={-t.overhead} />
                  <div className="flex items-baseline justify-between border-t border-line pt-2">
                    <dt className="font-medium text-ink">Net</dt>
                    <dd
                      className={`font-mono text-base font-semibold ${
                        t.net >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatCents(t.net)}
                      {margin !== null && (
                        <span className="ml-2 text-2xs text-ink-muted">
                          {margin.toFixed(0)}%
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- 3. Ledger ---- */}
      <section aria-labelledby="orders-heading" className="mt-12">
        <h2 id="orders-heading" className="font-display text-lg font-semibold text-ink">
          Orders
        </h2>

        {orders.length === 0 ? (
          <p className="mt-4 border border-line bg-bg-raised px-5 py-8 text-center text-sm text-ink-secondary">
            No orders yet.
          </p>
        ) : (
          /* Wide table, own scroller. The page body must never scroll
             sideways — a horizontally scrolling dashboard is unusable on a
             laptop trackpad. */
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[64rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-raised text-left">
                  {[
                    "Date",
                    "Order",
                    "Items",
                    "Ship to",
                    "Gross",
                    "Fees",
                    "Cost",
                    "Net",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs uppercase tracking-wider text-ink-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top transition-colors hover:bg-bg-raised">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-2xs text-ink-secondary">
                      {order.created.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="block text-ink-muted">
                        {order.created.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block text-ink">{order.customerName ?? "—"}</span>
                      <span className="block font-mono text-2xs text-ink-muted">
                        {order.customerEmail ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ul className="space-y-1">
                        {order.lines.map((line, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-3 w-3 shrink-0 border border-line-strong"
                              style={{ background: line.colorHex }}
                            />
                            {line.faceDesignId && (
                              <KnobFaceIcon
                                id={line.faceDesignId}
                                className="h-3.5 w-3.5 shrink-0 text-ink-muted"
                              />
                            )}
                            <span className="text-ink-secondary">
                              {line.qty}× {line.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="max-w-[16rem] px-3 py-3 text-2xs leading-relaxed text-ink-muted">
                      {order.shipTo ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-ink">
                      {formatCents(order.economics.grossCents)}
                      {order.economics.shippingChargedCents > 0 && (
                        <span className="block text-2xs text-ink-muted">
                          incl. {formatCents(order.economics.shippingChargedCents)} ship
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-ink-muted">
                      {formatCents(order.economics.stripeFeeCents)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-ink-muted">
                      {formatCents(order.economics.totalCostCents)}
                      {!order.economics.complete && (
                        // A line with no entry in costs.json contributes zero
                        // cost, which would silently overstate the margin. Say
                        // so rather than showing a confident wrong number.
                        <span
                          className="block text-2xs text-accent"
                          title="One or more items have no entry in costs.json — cost is understated"
                        >
                          incomplete
                        </span>
                      )}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-3 font-mono font-semibold ${
                        order.economics.netCents >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatCents(order.economics.netCents)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <StatusChip order={order} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- 4. Assumptions ---- */}
      <section aria-labelledby="assumptions-heading" className="mt-12 pb-16">
        <h2
          id="assumptions-heading"
          className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
        >
          Cost assumptions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Every margin above depends on these. They live in{" "}
          <code className="font-mono text-2xs text-ink">src/data/costs.json</code>; change
          a number, redeploy, and this whole page recalculates. Correct them against a
          kitchen scale, the slicer&rsquo;s time estimate, and your actual filament
          invoice — until then treat the margins as indicative.
        </p>
        <dl className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Filament", `$${COST_ASSUMPTIONS.materialCostPerKgUsd.toFixed(2)}/kg`],
            ["Failure allowance", `${COST_ASSUMPTIONS.failureAllowancePct}%`],
            ["Colour purge", `${COST_ASSUMPTIONS.colorChangeoverGrams}g per change`],
            ["Machine", `$${COST_ASSUMPTIONS.machineCostPerHourUsd.toFixed(2)}/hr`],
            ["Labour", `$${COST_ASSUMPTIONS.labourRatePerHourUsd.toFixed(2)}/hr`],
            ["Handling", `${COST_ASSUMPTIONS.labourMinutesPerOrder} min per order`],
            ["Packaging", `$${COST_ASSUMPTIONS.packagingCostUsd.toFixed(2)}`],
            ["Postage", `$${COST_ASSUMPTIONS.shippingCostUsd.toFixed(2)}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-bg-raised px-4 py-3">
              <dt className="font-mono text-2xs uppercase tracking-wider text-ink-muted">
                {label}
              </dt>
              <dd className="mt-1 font-mono text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="font-mono text-ink-muted">{formatCents(value)}</dd>
    </div>
  );
}

function StatusChip({ order }: { order: OpsOrder }) {
  if (order.status === "refunded") {
    return <Chip tone="error">Refunded</Chip>;
  }
  if (order.status === "unpaid") {
    return <Chip tone="muted">Unpaid</Chip>;
  }
  return order.fulfilled ? <Chip tone="success">Shipped</Chip> : <Chip tone="accent">To print</Chip>;
}

function Chip({
  tone,
  children,
}: {
  tone: "success" | "accent" | "error" | "muted";
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-success/15 text-success",
    accent: "bg-accent/15 text-accent",
    error: "bg-error/15 text-error",
    muted: "bg-bg-overlay text-ink-muted",
  } as const;
  return (
    <span
      className={`px-2 py-0.5 font-mono text-2xs uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function NotConfigured({ data }: { data: Extract<OpsData, { configured: false }> }) {
  return (
    <div className="shell py-16">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Operations
      </h1>
      {data.reason === "no_key" ? (
        <div className="mt-6 max-w-2xl border border-accent/40 bg-accent/10 p-6">
          <p className="font-display text-base font-semibold text-ink">
            No Stripe key on this deployment.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            This dashboard reads orders straight from Stripe rather than keeping its own
            database, so it needs{" "}
            <code className="font-mono text-2xs text-ink">STRIPE_SECRET_KEY</code> set. Use
            a <strong className="text-ink">restricted key</strong> with read access to
            Checkout Sessions, Payment Intents and Charges — this page never writes to
            Stripe, so it should not hold a key that can.
          </p>
        </div>
      ) : (
        <div className="mt-6 max-w-2xl border border-error/40 bg-error/10 p-6">
          <p className="font-display text-base font-semibold text-ink">
            Stripe rejected the request.
          </p>
          <p className="mt-2 font-mono text-2xs leading-relaxed text-ink-secondary">
            {data.message}
          </p>
        </div>
      )}
    </div>
  );
}
