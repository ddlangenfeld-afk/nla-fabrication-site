"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { getFaceDesign } from "@/lib/faceDesigns";
import { useGlyphSelection } from "@/lib/glyphSelection";
import { usePrefersReducedMotion } from "@/lib/motion";
import type { Product } from "@/lib/products";
import { productPhotos } from "@/lib/productPhotos";
import { RENDER_SIZE, renderSet } from "@/lib/renders";

type GalleryImage = { key: string; label: string; src: string; alt: string };

/** How long an image stays up before the carousel advances itself. */
const AUTOPLAY_MS = 8000;

/** Must match the slide animations in globals.css. */
const SLIDE_MS = 420;

/*
 * Which frame is showing, which one is on its way out, and which way the pair
 * is travelling. `dir: 0` means "arrive without animating" — the first paint,
 * and every reset onto a different glyph, where a slide would imply a step
 * the visitor never took.
 */
type Nav = { index: number; exiting: number | null; dir: 0 | 1 | -1 };

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
  const [nav, setNav] = useState<Nav>({ index: 0, exiting: null, dir: 0 });
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

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
  const count = images?.length ?? 0;

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
    setNav({ index: 0, exiting: null, dir: 0 });
  }

  const index = count ? Math.min(nav.index, count - 1) : 0;
  const current = images?.[index];

  const step = (delta: 1 | -1) =>
    setNav((n) => {
      if (count < 2) return n;
      const from = Math.min(n.index, count - 1);
      return { index: (((from + delta) % count) + count) % count, exiting: from, dir: delta };
    });

  /*
   * Auto-advance, off whenever there is nothing to advance through (one
   * image or none), the visitor asked for reduced motion, or it is paused —
   * explicitly via the control, or implicitly because a pointer or keyboard
   * focus is somewhere inside the viewer (WCAG 2.2.2: moving content has to
   * stop for anyone reading or aiming a click at it, not just on request).
   *
   * Depending on the current index looks redundant — the interval already
   * re-fires itself — but it is what makes a manual Prev/Next click restart
   * the eight seconds instead of the auto-advance landing right on top of it.
   */
  const autoplay = count > 1 && !reduceMotion && !paused && !holding;
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      setNav((n) => {
        const from = Math.min(n.index, count - 1);
        return { index: (from + 1) % count, exiting: from, dir: 1 };
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, count, nav.index]);

  // Retire the outgoing frame once it has finished travelling. On a timer
  // rather than animationend so a skipped or interrupted animation — reduced
  // motion, a background tab — can't strand it on top of the stack.
  useEffect(() => {
    if (nav.exiting === null) return;
    const t = window.setTimeout(
      () => setNav((n) => ({ ...n, exiting: null })),
      SLIDE_MS + 60
    );
    return () => window.clearTimeout(t);
  }, [nav.exiting, nav.index]);

  function slideClass(i: number): string {
    if (i === index) {
      if (nav.dir === 0) return "";
      return nav.dir === 1 ? "nla-slide-in-right" : "nla-slide-in-left";
    }
    if (i === nav.exiting) {
      return nav.dir === 1 ? "nla-slide-out-left" : "nla-slide-out-right";
    }
    // Still rendered, so the browser fetches it well before its turn.
    return "opacity-0 pointer-events-none";
  }

  return (
    <div>
      <div
        className={`surface viewer-bleed relative border-line-strong p-2 sm:p-6 ${
          dimmed ? "opacity-50" : ""
        }`}
        onMouseEnter={() => setHolding(true)}
        onMouseLeave={() => setHolding(false)}
        onFocus={() => setHolding(true)}
        onBlur={() => setHolding(false)}
        onKeyDown={(e) => {
          if (count < 2) return;
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
      >
        {images && current ? (
          <div className="relative aspect-square overflow-hidden">
            {images.map((img, i) => (
              <div
                key={img.key}
                className={`absolute inset-0 ${slideClass(i)}`}
                aria-hidden={i !== index}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={RENDER_SIZE}
                  height={RENDER_SIZE}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  className="h-full w-full object-contain"
                  // The first frame is the largest element above the fold.
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <ProductArt
            art={product.art}
            title={product.name}
            glyphId={activeGlyph}
            glyphSurface={surface}
            className="h-auto w-full"
          />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="bg-bg-overlay/80 absolute top-1/2 left-3 z-10 -translate-y-1/2 border border-line p-2 text-ink-secondary backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:left-9"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="bg-bg-overlay/80 absolute top-1/2 right-3 z-10 -translate-y-1/2 border border-line p-2 text-ink-secondary backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-9"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        )}
      </div>

      {/* Screen readers get a position announcement instead of the visual
          arrows + counter, which are decorative/redundant to them. */}
      <p aria-live="polite" className="sr-only">
        {current && count > 1 ? `Image ${index + 1} of ${count}` : null}
      </p>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            aria-hidden="true"
            className="font-mono text-2xs uppercase tracking-wider text-ink-muted"
          >
            {index + 1} / {count}
          </span>
          {!reduceMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="border border-line px-3 py-1.5 font-mono text-2xs uppercase tracking-wider text-ink-secondary transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {paused ? "Play" : "Pause"}
            </button>
          )}
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M12.5 5 L7 10 L12.5 15" : "M7.5 5 L13 10 L7.5 15"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
