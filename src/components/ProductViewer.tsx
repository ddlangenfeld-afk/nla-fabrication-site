"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { getFaceDesign } from "@/lib/faceDesigns";
import { useGlyphSelection } from "@/lib/glyphSelection";
import type { Product } from "@/lib/products";
import { productPhotos } from "@/lib/productPhotos";
import { RENDER_SIZE, renderSet } from "@/lib/renders";

type GalleryImage = { key: string; label: string; src: string; alt: string };

/*
 * The product image, whatever that currently is.
 *
 * One component owns the whole left column of the product page so there is a
 * single place that answers "what are we allowed to show for this part right
 * now" — curated photography if a set exists for the selected glyph, else a
 * published CAD render set, else the technical drawing. All three branches
 * react to the glyph picker in the opposite column, which is the point:
 * before this, choosing Skull changed the button label and left a drawing of
 * the factory single line sitting next to it.
 *
 * The render branch is live code with no live data — see lib/renders.ts for
 * why nothing is published yet. It is written out rather than left as a TODO
 * because the switch-on is meant to be a data change, not a build. The photo
 * branch (lib/productPhotos.ts) is independent of that gate: it is not a
 * render of the disputed envelope, it is photography chosen per glyph.
 */
export function ProductViewer({
  product,
  dimmed = false,
}: {
  product: Product;
  dimmed?: boolean;
}) {
  const { glyphId } = useGlyphSelection();
  const [index, setIndex] = useState(0);

  // Only glyph products track a selection; everything else shows its part as
  // it ships, with no face to choose.
  const activeGlyph = product.hasFaceDesigns ? glyphId : undefined;
  const surface = product.glyphSurface ?? "knob";
  const design = activeGlyph ? getFaceDesign(activeGlyph) : null;

  const photos = activeGlyph ? productPhotos(activeGlyph, product.name) : null;
  const cadSet =
    !photos && activeGlyph ? renderSet(product.slug, activeGlyph, product.name) : null;

  const images: GalleryImage[] | null =
    photos?.map((p, i) => ({ key: String(i), label: p.label, src: p.src, alt: p.alt })) ??
    cadSet?.map((r) => ({ key: r.view, label: r.label, src: r.src, alt: r.alt })) ??
    null;

  // Land back on the first image whenever the active set changes underneath
  // — a different glyph, or crossing from a photo gallery to a render set —
  // rather than carrying over an index that may not exist in the new set.
  // Adjusted during render (not an effect) per the project's react-hooks
  // lint rule against setState-in-effect; see the React docs' "adjusting
  // state when a prop changes" pattern.
  const setKey = photos ? `photo:${activeGlyph}` : cadSet ? `render:${activeGlyph}` : `none:${activeGlyph}`;
  const [prevSetKey, setPrevSetKey] = useState(setKey);
  if (setKey !== prevSetKey) {
    setPrevSetKey(setKey);
    setIndex(0);
  }

  const current = images?.[Math.min(index, images.length - 1)];

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
            // The first image is the largest element above the fold on this page.
            priority={index === 0}
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

      {images && images.length > 1 && (
        <div
          role="group"
          aria-label="View"
          className="mt-3 flex flex-wrap gap-2"
        >
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={index === i}
              className={`border px-3 py-1.5 font-mono text-2xs uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                index === i
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
              }`}
            >
              {img.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-ink-muted">
        {photos ? (
          <>Product photography</>
        ) : cadSet ? (
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
