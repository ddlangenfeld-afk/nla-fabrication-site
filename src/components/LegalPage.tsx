import Link from "next/link";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-line bg-bg-inset">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Legal</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
            Last updated {updated}
          </p>
        </div>
      </section>

      <div className="border-b border-line bg-bg-raised">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <p className="border border-accent/40 bg-accent/10 px-4 py-3 text-sm leading-relaxed text-ink">
            <strong className="font-semibold">Placeholder text.</strong> This page is a
            structural stand-in so checkout can go live in test mode. It has not been
            reviewed by a lawyer and must not be treated as final before real orders ship.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-ink-secondary sm:px-6 sm:py-16">
        {children}
      </section>

      <section className="border-t border-line bg-bg-inset">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="text-sm text-ink-secondary">
            Questions about an order?{" "}
            <Link href="/contact" className="link-inline">
              Get in touch
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
