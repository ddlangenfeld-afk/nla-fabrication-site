"use client";

import Link from "next/link";
import { useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { FaceDesignPicker } from "@/components/FaceDesignPicker";
import { useCart } from "@/lib/cart";
import { CUSTOM_COLOR, DEFAULT_COLOR_ID, getColor } from "@/lib/colors";
import { getFaceDesign } from "@/lib/faceDesigns";
import { useGlyphSelection } from "@/lib/glyphSelection";
import { formatPrice, hasPriceLadder, unitPriceCents, type Product } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const ladder = hasPriceLadder(product);
  /* Default to the middle rung, not the first. On a handing choice the first
     variant is a neutral default; on a ladder it is the cheapest, and
     defaulting to the cheapest anchors every buyer at the bottom of a range
     the model says they are largely insensitive to. */
  const defaultVariant = ladder
    ? product.variants?.[Math.floor((product.variants.length - 1) / 2)]?.id
    : product.variants?.[0]?.id;
  const [variantId, setVariantId] = useState(defaultVariant);
  const [colorId, setColorId] = useState(DEFAULT_COLOR_ID);
  /* Colour is local, the glyph is not: the glyph also drives the drawing in
     the opposite column, so it lives in a context both can read. Colour has
     no equivalent — the drawing is a line drawing and has no fill to change —
     so lifting it too would be state shared with nobody. */
  const { glyphId: faceDesignId, setGlyphId: setFaceDesignId } = useGlyphSelection();
  const [added, setAdded] = useState(false);

  const color = getColor(colorId);
  const faceDesign = getFaceDesign(faceDesignId);
  const unitCents = unitPriceCents(product, variantId);

  function handleAdd() {
    addItem({
      slug: product.slug,
      variantId,
      colorId,
      faceDesignId: product.hasFaceDesigns ? faceDesignId : undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  /* Deep-links to the contact form with the part and colour already stated, so
     a custom-colour enquiry arrives with the two facts needed to quote it
     instead of "do you do other colours". Face design has no equivalent link:
     unlike colour, it costs nothing extra to add another one to the array in
     faceDesigns.ts, so a bespoke request there is a product roadmap question,
     not a quoting question. */
  const customHref = `/contact?subject=${encodeURIComponent(
    `Custom colour — ${product.name}`
  )}`;

  // The price goes in the button only on a ladder, where the header shows a
  // range and this is the first place the actual figure appears.
  const priceSuffix = ladder && unitCents != null ? ` — ${formatPrice(unitCents)}` : "";
  const label = product.hasFaceDesigns
    ? `Add to cart${priceSuffix} — ${faceDesign.name} · ${color.name}`
    : `Add to cart${priceSuffix} — ${color.name}`;

  return (
    <div className="space-y-6">
      {product.hasVariants && product.variants && (
        <fieldset>
          <legend className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
            {ladder ? "Specification" : "Side"}
          </legend>
          {/* A handing choice is two equivalent options and belongs side by
              side. A ladder is a vertical decision with different content and
              different money at each step, so it stacks and each row states
              both. Forcing the ladder into the two-up grid was the version
              that made $19 and $59 look like the same kind of choice. */}
          <div className={`mt-3 gap-2 ${ladder ? "flex flex-col" : "grid grid-cols-2"}`}>
            {product.variants.map((variant) => {
              const selected = variantId === variant.id;
              return (
                <label
                  key={variant.id}
                  className={`cursor-pointer border transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                    ladder
                      ? "px-4 py-3.5"
                      : "flex items-center justify-center px-4 py-3 text-sm"
                  } ${
                    selected
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={selected}
                    onChange={() => setVariantId(variant.id)}
                    className="sr-only"
                  />
                  {ladder ? (
                    <>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">{variant.label}</span>
                        <span
                          className={`shrink-0 font-mono text-sm ${
                            selected ? "text-accent" : "text-ink-muted"
                          }`}
                        >
                          {formatPrice(variant.priceCents ?? product.priceCents ?? 0)}
                        </span>
                      </span>
                      {variant.note && (
                        <span className="mt-1.5 block text-xs leading-relaxed text-ink-muted">
                          {variant.note}
                        </span>
                      )}
                    </>
                  ) : (
                    variant.label
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.hasFaceDesigns && (
        <FaceDesignPicker
          value={faceDesignId}
          onChange={setFaceDesignId}
          surface={product.glyphSurface}
        />
      )}

      <ColorPicker value={colorId} onChange={setColorId} />

      <button
        type="button"
        onClick={handleAdd}
        className={`btn-accent w-full px-6 py-4 font-medium active:scale-[0.99] ${
          added ? "bg-success text-accent-ink" : "bg-accent text-accent-ink hover:bg-accent-bright"
        }`}
      >
        {added ? "Added to cart ✓" : label}
      </button>
      <p aria-live="polite" className="sr-only">
        {added
          ? `${product.name}${
              product.hasFaceDesigns
                ? `, ${faceDesign.name} ${
                    product.glyphSurface === "aperture" ? "symbol" : "face"
                  }`
                : ""
            } in ${color.name} added to cart`
          : ""}
      </p>

      {/* Custom colour, stated as terms rather than as a button. The terms are
          the whole point: without a minimum, one custom order commits us to a
          full spool of a colour nobody else has asked for. */}
      <p className="border-t border-line pt-5 text-sm leading-relaxed text-ink-muted">
        Need a colour that isn&rsquo;t listed?{" "}
        <Link href={customHref} className="link-inline">
          Request a custom finish
        </Link>{" "}
        — minimum {CUSTOM_COLOR.minimumUnits} units, ${CUSTOM_COLOR.setupFeeUsd} setup,{" "}
        {CUSTOM_COLOR.leadTimeWeeks} weeks while the material is sourced.
      </p>
    </div>
  );
}
