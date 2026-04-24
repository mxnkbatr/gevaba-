"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export type ShopCartItem = {
  productId: string;
  quantity: number;
};

const CART_KEY = "shop_cart_v1";

async function loadStored(): Promise<ShopCartItem[]> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: CART_KEY });
      return value ? (JSON.parse(value) as ShopCartItem[]) : [];
    }
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as ShopCartItem[]) : [];
  } catch {
    return [];
  }
}

async function saveStored(items: ShopCartItem[]): Promise<void> {
  const value = JSON.stringify(items);
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: CART_KEY, value });
    return;
  }
  window.localStorage.setItem(CART_KEY, value);
}

export function useShopCart() {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStored();
      if (cancelled) return;
      setItems(Array.isArray(stored) ? stored : []);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveStored(items);
  }, [items, hydrated]);

  const count = useMemo(
    () => items.reduce((acc, it) => acc + Math.max(0, it.quantity ?? 0), 0),
    [items],
  );

  const add = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const qty = Math.max(1, Number(quantity ?? 1));
      const idx = prev.findIndex((p) => p.productId === productId);
      if (idx === -1) return [...prev, { productId, quantity: qty }];
      const next = prev.slice();
      next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const qty = Math.max(0, Math.floor(Number(quantity ?? 0)));
      if (qty === 0) return prev.filter((p) => p.productId !== productId);
      const idx = prev.findIndex((p) => p.productId === productId);
      if (idx === -1) return [...prev, { productId, quantity: qty }];
      const next = prev.slice();
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, hydrated, count, add, setQuantity, remove, clear };
}

