"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product.slug, variantId);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="space-y-4">
      {product.hasVariants && product.variants && (
        <fieldset>
          <legend className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
            Side
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {product.variants.map((variant) => (
              <label
                key={variant.id}
                className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${
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

      <button
        type="button"
        onClick={handleAdd}
        className={`w-full px-6 py-4 font-medium transition-all active:scale-[0.99] ${
          added
            ? "bg-success text-accent-ink"
            : "bg-accent text-accent-ink hover:bg-accent-bright"
        }`}
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </button>
      <p aria-live="polite" className="sr-only">
        {added ? `${product.name} added to cart` : ""}
      </p>
    </div>
  );
}
