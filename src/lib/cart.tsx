"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProduct } from "@/lib/products";

export type CartItem = {
  slug: string;
  variantId?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  addItem: (slug: string, variantId?: string) => void;
  removeItem: (slug: string, variantId?: string) => void;
  setQty: (slug: string, variantId: string | undefined, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "nla-cart-v1";

function sameLine(a: CartItem, slug: string, variantId?: string) {
  return a.slug === slug && (a.variantId ?? null) === (variantId ?? null);
}

function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as CartItem).slug === "string" &&
        typeof (i as CartItem).qty === "number" &&
        (i as CartItem).qty > 0 &&
        getProduct((i as CartItem).slug)?.status === "available"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode) — cart still works in-memory
    }
  }, [items, ready]);

  const addItem = useCallback((slug: string, variantId?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, slug, variantId));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, slug, variantId) ? { ...i, qty: Math.min(i.qty + 1, 99) } : i
        );
      }
      return [...prev, { slug, variantId, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((slug: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, slug, variantId)));
  }, []);

  const setQty = useCallback(
    (slug: string, variantId: string | undefined, qty: number) => {
      setItems((prev) =>
        qty <= 0
          ? prev.filter((i) => !sameLine(i, slug, variantId))
          : prev.map((i) =>
              sameLine(i, slug, variantId) ? { ...i, qty: Math.min(qty, 99) } : i
            )
      );
    },
    []
  );

  const clear = useCallback(() => setItems([]), []);

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

  const value = useMemo(
    () => ({ items, ready, addItem, removeItem, setQty, clear, count, subtotalCents }),
    [items, ready, addItem, removeItem, setQty, clear, count, subtotalCents]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
