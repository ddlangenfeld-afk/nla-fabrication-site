"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getProduct } from "@/lib/products";

export type CartItem = {
  slug: string;
  variantId?: string;
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

function sameLine(item: CartItem, slug: string, variantId?: string) {
  return item.slug === slug && (item.variantId ?? null) === (variantId ?? null);
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).slug === "string" &&
        typeof (i as CartItem).qty === "number" &&
        (i as CartItem).qty > 0 &&
        // Drops lines for parts that were removed or moved to "coming soon"
        // since the cart was saved.
        getProduct((i as CartItem).slug)?.status === "available"
    );
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
export function addItem(slug: string, variantId?: string) {
  update((prev) => {
    const existing = prev.find((i) => sameLine(i, slug, variantId));
    if (existing) {
      return prev.map((i) =>
        sameLine(i, slug, variantId) ? { ...i, qty: Math.min(i.qty + 1, MAX_QTY) } : i
      );
    }
    return [...prev, { slug, variantId, qty: 1 }];
  });
}

export function removeItem(slug: string, variantId?: string) {
  update((prev) => prev.filter((i) => !sameLine(i, slug, variantId)));
}

export function setQty(slug: string, variantId: string | undefined, qty: number) {
  update((prev) =>
    qty <= 0
      ? prev.filter((i) => !sameLine(i, slug, variantId))
      : prev.map((i) =>
          sameLine(i, slug, variantId) ? { ...i, qty: Math.min(qty, MAX_QTY) } : i
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
