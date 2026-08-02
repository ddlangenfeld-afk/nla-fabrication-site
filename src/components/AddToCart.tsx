"use client";

import Link from "next/link";
import { useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { FaceDesignPicker } from "@/components/FaceDesignPicker";
import { useCart } from "@/lib/cart";
import { CUSTOM_COLOR, DEFAULT_COLOR_ID, getColor } from "@/lib/colors";
import { DEFAULT_FACE_DESIGN_ID, getFaceDesign } from "@/lib/faceDesigns";
import type { Product } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [colorId, setColorId] = useState(DEFAULT_COLOR_ID);
  const [faceDesignId, setFaceDesignId] = useState(DEFAULT_FACE_DESIGN_ID);
  const [added, setAdded] = useState(false);

  const color = getColor(colorId);
  const faceDesign = getFaceDesign(faceDesignId);

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

  const label = product.hasFaceDesigns
    ? `Add to cart — ${faceDesign.name} · ${color.name}`
    : `Add to cart — ${color.name}`;

  return (
    <div className="space-y-6">
      {product.hasVariants && product.variants && (
        <fieldset>
          <legend className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
            Side
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {product.variants.map((variant) => (
              <label
                key={variant.id}
                className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                  variantId === variant.id
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variantId === variant.id}
                  onChange={() => setVariantId(variant.id)}
                  className="sr-only"
                />
                {variant.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {product.hasFaceDesigns && (
        <FaceDesignPicker value={faceDesignId} onChange={setFaceDesignId} />
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
              product.hasFaceDesigns ? `, ${faceDesign.name} face` : ""
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
