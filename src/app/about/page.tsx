import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — A one-person shop for NLA Civic EK/EJ parts",
  description:
    "NLA Fabrication is a one-person shop run by a hard-surface 3D designer who restored his own 1996 Civic. Every part is a documented failure point with no new replacement available.",
  alternates: { canonical: "/about" },
};

const process = [
  {
    step: "01",
    title: "Find a real failure",
    body: "Every part starts as a recurring complaint on owner forums — not a guess about what might sell. If people aren't already breaking it and hunting for it, it doesn't get modeled.",
  },
  {
    step: "02",
    title: "Confirm it's actually gone",
    body: "Discontinued status gets verified against the manufacturer's own parts catalog, and used-market prices get checked as a demand signal. If a new part is still available, there's no reason for this shop to make one.",
  },
  {
    step: "03",
    title: "Model it properly",
    body: "Hard-surface CAD from the original geometry, with material and print orientation chosen for how the part is actually loaded. Where the original design was under-built, the reproduction gets more material there.",
  },
  {
    step: "04",
    title: "Fit it to a real car",
    body: "Nothing goes on sale until it's installed on an actual EK. That's the whole reason the pipeline moves slowly and the catalog is short.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="blueprint-grid border-b border-line">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">About</p>
          <h1 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
            One car, one desk, and a list of parts nobody makes anymore.
          </h1>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-14 text-base leading-relaxed text-ink-secondary sm:px-6 sm:py-20 sm:text-lg">
          <p>
            NLA Fabrication is one person. He restored and wrapped his own 1996 Civic, and
            everything about this shop comes out of that car — the parts list, the
            material choices, the fact that the catalog is three items long instead of
            three hundred.
          </p>
          <p>
            By training he&rsquo;s a 3D designer: hard-surface modeling, environment art,
            and motion graphics. That&rsquo;s the exact skill this needs. Reproducing a
            latch mechanism accurately enough that it drops into 25-year-old mounting
            points is a hard-surface modeling problem, not a sculpting one.
          </p>
          <p>
            The workshop is an apartment desk with a printer on it. No lift, no bay, no
            spray booth. That constraint is why this business is small functional parts
            and not body kits — and honestly, it&rsquo;s why the parts are good. A part
            that has to succeed at this scale gets a lot more attention than one item in a
            catalog of thousands.
          </p>
          <p className="border-l-2 border-accent pl-6 text-ink">
            The premise is right there in the name. &ldquo;NLA&rdquo; is what the parts
            catalog says when a part is gone for good: <em>No Longer Available</em>. Every
            item here is a part that came back.
          </p>
        </div>
      </section>

      <section aria-labelledby="process-heading" className="border-b border-line bg-bg-raised">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Process</p>
          <h2
            id="process-heading"
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            How a part gets made
          </h2>
          <ol className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
            {process.map((item) => (
              <li key={item.step} className="bg-bg-raised p-6 sm:p-8">
                <p className="font-mono text-2xs tracking-widest text-accent">{item.step}</p>
                <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="honest-heading" className="border-b border-line">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <h2
            id="honest-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            What this shop is honest about
          </h2>
          <dl className="mt-8 space-y-7">
            {[
              [
                "These are aftermarket reproductions.",
                "Not original manufacturer parts, and not affiliated with any vehicle manufacturer. OEM part numbers appear here only to tell you what a part fits.",
              ],
              [
                "3D-printed is not injection-molded.",
                "Printed parts have layer lines and different failure behavior than the original. Where that trade-off matters, the material and orientation are chosen to land on the right side of it — and where a printed part would be worse than the original, it doesn't get sold.",
              ],
              [
                "Interior parts only, for now.",
                "PETG is right for the cabin. It is not right for underhood heat. Anything that lives in the engine bay will ship in ASA or nylon, and it isn't ready yet.",
              ],
              [
                "The catalog grows slowly.",
                "Every part is fitment-verified on a real car first. That's the bottleneck, and it isn't going away.",
              ],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="font-display text-base font-semibold text-ink">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-secondary">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-bg-inset">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16">
          <p className="font-display text-xl font-semibold tracking-tight text-ink">
            Know a part that belongs on this list?
          </p>
          <Link
            href="/contact"
            className="shrink-0 bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
