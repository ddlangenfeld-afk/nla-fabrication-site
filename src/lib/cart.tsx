"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_COLOR_ID, isValidColorId } from "@/lib/colors";
import { getProduct } from "@/lib/products";

export type CartItem = {
  slug: string;
  variantId?: string;
  /** Always set on write; older saved carts are migrated on read. */
  colorId: string;
  qty: number;
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
 * Colour is a third axis alongside part and side, so it is part of the line
 * identity: a black bezel and a red bezel are two lines, not one line with a
 * quantity of two. Every mutation therefore has to key on all three.
 */
function sameLine(item: CartItem, slug: string, variantId?: string, colorId?: string) {
  return (
    item.slug === slug &&
    (item.variantId ?? null) === (variantId ?? null) &&
    item.colorId === (colorId ?? DEFAULT_COLOR_ID)
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
      // Carts saved before colours existed have no colorId, and an unknown id
      // could survive a palette change. Both resolve to the default rather
      // than dropping the line — a cart that silently loses items is worse
      // than one that quietly picks black.
      .map((i) => ({
        ...i,
        colorId: isValidColorId(i.colorId) ? i.colorId : DEFAULT_COLOR_ID,
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
export function addItem(slug: string, variantId?: string, colorId: string = DEFAULT_COLOR_ID) {
  update((prev) => {
    const existing = prev.find((i) => sameLine(i, slug, variantId, colorId));
    if (existing) {
      return prev.map((i) =>
        sameLine(i, slug, variantId, colorId)
          ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) }
          : i
      );
    }
    return [...prev, { slug, variantId, colorId, qty: 1 }];
  });
}

export function removeItem(slug: string, variantId?: string, colorId?: string) {
  update((prev) => prev.filter((i) => !sameLine(i, slug, variantId, colorId)));
}

export function setQty(
  slug: string,
  variantId: string | undefined,
  colorId: string | undefined,
  qty: number
) {
  update((prev) =>
    qty <= 0
      ? prev.filter((i) => !sameLine(i, slug, variantId, colorId))
      : prev.map((i) =>
          sameLine(i, slug, variantId, colorId) ? { ...i, qty: Math.min(qty, MAX_QTY) } : i
        )
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
