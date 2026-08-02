"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_COLOR_ID, isValidColorId } from "@/lib/colors";
import { DEFAULT_FACE_DESIGN_ID, isValidFaceDesignId } from "@/lib/faceDesigns";
import { getProduct } from "@/lib/products";

export type CartItem = {
  slug: string;
  variantId?: string;
  /** Always set on write; older saved carts are migrated on read. */
  colorId: string;
  /** Always set on write; only meaningful for products with hasFaceDesigns. */
  faceDesignId: string;
  qty: number;
};

/*
 * A line's identity, independent of quantity. Every function that mutates the
 * cart takes one of these rather than four positional arguments — that split
 * held up fine at slug+variant+colour, but a fourth axis is where a positional
 * signature (slug, variantId, colorId, faceDesignId, qty) stops being
 * readable and starts being a place to swap two arguments by mistake.
 */
export type LineKey = {
  slug: string;
  variantId?: string;
  colorId?: string;
  faceDesignId?: string;
};

const STORAGE_KEY = "nla-cart-v1";
const MAX_QTY = 99;

/*
 * The cart lives in localStorage, which makes it an external store rather than
 * React state. `useSyncExternalStore` is the tool built for that: it gives us a
 * correct server snapshot (empty cart) for prerendering, a real one after
 * hydration, and cross-tab sync via the `storage` event for free.
 */

type Snapshot = {
  items: CartItem[];
  /** False until localStorage has been read — lets the UI show a skeleton
   *  instead of flashing an empty cart during hydration. */
  ready: boolean;
};

const SERVER_SNAPSHOT: Snapshot = { items: [], ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

/*
 * Colour and face design are each a fourth/fifth axis alongside part and
 * side, so both are part of line identity: a black classic-face knob set and
 * a black skull-face knob set are two lines, not one line with quantity two.
 */
function sameLine(item: CartItem, key: LineKey) {
  return (
    item.slug === key.slug &&
    (item.variantId ?? null) === (key.variantId ?? null) &&
    item.colorId === (key.colorId ?? DEFAULT_COLOR_ID) &&
    item.faceDesignId === (key.faceDesignId ?? DEFAULT_FACE_DESIGN_ID)
  );
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          typeof i === "object" &&
          i !== null &&
          typeof (i as CartItem).slug === "string" &&
          typeof (i as CartItem).qty === "number" &&
          (i as CartItem).qty > 0 &&
          // Drops lines for parts that were removed or moved to "coming soon"
          // since the cart was saved.
          getProduct((i as CartItem).slug)?.status === "available"
      )
      // Carts saved before colours/face designs existed are missing those
      // fields, and an unknown id could survive a palette change. Both
      // resolve to the default rather than dropping the line — a cart that
      // silently loses items is worse than one that quietly picks black.
      .map((i) => ({
        ...i,
        colorId: isValidColorId(i.colorId) ? i.colorId : DEFAULT_COLOR_ID,
        faceDesignId: isValidFaceDesignId(i.faceDesignId)
          ? i.faceDesignId
          : DEFAULT_FACE_DESIGN_ID,
      }));
  } catch {
    return [];
  }
}

function readStorage(): CartItem[] {
  try {
    return parseCart(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage blocked (private mode / disabled cookies) — cart stays in memory.
    return [];
  }
}

function getSnapshot(): Snapshot {
  if (!loaded) {
    loaded = true;
    snapshot = { items: readStorage(), ready: true };
  }
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(items: CartItem[]) {
  snapshot = { items, ready: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable — in-memory cart still works for this session.
  }
  emit();
}

function update(updater: (prev: CartItem[]) => CartItem[]) {
  commit(updater(getSnapshot().items));
}

function handleStorage(event: StorageEvent) {
  // key === null means the whole store was cleared.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = { items: readStorage(), ready: true };
  emit();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

// Module-level and therefore referentially stable — safe as effect dependencies.
export function addItem(key: LineKey) {
  update((prev) => {
    const existing = prev.find((i) => sameLine(i, key));
    if (existing) {
      return prev.map((i) =>
        sameLine(i, key) ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i
      );
    }
    return [
      ...prev,
      {
        slug: key.slug,
        variantId: key.variantId,
        colorId: key.colorId ?? DEFAULT_COLOR_ID,
        faceDesignId: key.faceDesignId ?? DEFAULT_FACE_DESIGN_ID,
        qty: 1,
      },
    ];
  });
}

export function removeItem(key: LineKey) {
  update((prev) => prev.filter((i) => !sameLine(i, key)));
}

export function setQty(key: LineKey, qty: number) {
  update((prev) =>
    qty <= 0
      ? prev.filter((i) => !sameLine(i, key))
      : prev.map((i) => (sameLine(i, key) ? { ...i, qty: Math.min(qty, MAX_QTY) } : i))
  );
}

export function clearCart() {
  commit([]);
}

export function useCart() {
  const { items, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const { count, subtotalCents } = useMemo(() => {
    let count = 0;
    let subtotalCents = 0;
    for (const item of items) {
      const product = getProduct(item.slug);
      if (!product || product.priceCents == null) continue;
      count += item.qty;
      subtotalCents += product.priceCents * item.qty;
    }
    return { count, subtotalCents };
  }, [items]);

  return {
    items,
    ready,
    count,
    subtotalCents,
    addItem,
    removeItem,
    setQty,
    clear: clearCart,
  };
}
