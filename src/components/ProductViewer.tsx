"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { getFaceDesign } from "@/lib/faceDesigns";
import { useGlyphSelection } from "@/lib/glyphSelection";
import type { Product } from "@/lib/products";
import { RENDER_SIZE, RENDER_VIEWS, renderSet, type RenderView } from "@/lib/renders";

/*
 * The product image, whatever that currently is.
 *
 * One component owns the whole left column of the product page so there is a
 * single place that answers "what are we allowed to show for this part right
 * now" — a published CAD render set if one exists, otherwise the technical
 * drawing. Both branches react to the glyph picker in the opposite column,
 * which is the point: before this, choosing Skull changed the button label and
 * left a drawing of the factory single line sitting next to it.
 *
 * The render branch is live code with no live data — see lib/renders.ts for
 * why nothing is published yet. It is written out rather than left as a TODO
 * because the switch-on is meant to be a data change, not a build.
 */
export function ProductViewer({
  product,
  dimmed = false,
}: {
  product: Product;
  dimmed?: boolean;
}) {
  const { glyphId } = useGlyphSelection();
  const [view, setView] = useState<RenderView>("hero");

  // Only glyph products track a selection; everything else shows its part as
  // it ships, with no face to choose.
  const activeGlyph = product.hasFaceDesigns ? glyphId : undefined;
  const surface = product.glyphSurface ?? "knob";
  const set = activeGlyph ? renderSet(product.slug, activeGlyph, product.name) : null;
  const current = set?.find((r) => r.view === view) ?? set?.[0];
  const design = activeGlyph ? getFaceDesign(activeGlyph) : null;

  return (
    <div>
      <div className={`surface border-line-strong p-6 ${dimmed ? "opacity-50" : ""}`}>
        {current ? (
          <Image
            src={current.src}
            alt={current.alt}
            width={RENDER_SIZE}
            height={RENDER_SIZE}
            className="h-auto w-full"
            // The hero is the largest element above the fold on this page.
            priority={view === "hero"}
          />
        ) : (
          <ProductArt
            art={product.art}
            title={product.name}
            glyphId={activeGlyph}
            glyphSurface={surface}
            className="h-auto w-full"
          />
        )}
      </div>

      {set && (
        <div
          role="group"
          aria-label="View"
          className="mt-3 flex flex-wrap gap-2"
        >
          {RENDER_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={`border px-3 py-1.5 font-mono text-2xs uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                view === id
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
        {set ? (
          <>Studio render from the production CAD</>
        ) : (
          <>Engineering drawing — production photography follows the first release batch</>
        )}
        {design && (
          <>
            {" · "}
            {design.name} {surface === "aperture" ? "symbol" : "face"}
          </>
        )}
      </p>
    </div>
  );
}
