"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the hosting platform's logs; no analytics service wired up yet.
    console.error(error);
  }, [error]);

  return (
    <section className="blueprint-grid">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-error">
          Unexpected fault
        </p>
        <h1 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          Something broke on our end.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-secondary">
          Not your fault, and nothing in your cart was lost. Try again — if it keeps
          happening, send a note and it&rsquo;ll get looked at.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-accent px-7 py-3.5 font-medium text-accent-ink transition-colors hover:bg-accent-bright"
          >
            Try again
          </button>
          <Link
            href="/contact"
            className="border border-line-strong px-7 py-3.5 font-medium text-ink-secondary transition-colors hover:border-accent hover:text-ink"
          >
            Report it
          </Link>
        </div>

        {error.digest && (
          <p className="mt-10 border-t border-line pt-6 font-mono text-2xs uppercase tracking-wider text-ink-muted">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </section>
  );
}
