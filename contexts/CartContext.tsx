"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Preferences } from "@capacitor/preferences";

export type ShopCategory =
  | "sutra"
  | "incense"
  | "statue"
  | "mala"
  | "ritual"
  | "blessing"
  | "other";

export interface ShopProduct {
  _id?: string;
  name: { mn: string; en: string };
  description: { mn: string; en: string };
  price: number; // MNT
  images: string[];
  category: ShopCategory;
  stock: number; // -1 unlimited
  isActive: boolean;
  isFeatured: boolean;
  type: "physical" | "digital";
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface CartItem {
  product: ShopProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ShopProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "cart_items";

function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

async function loadStored(): Promise<CartItem[]> {
  try {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      return value ? (JSON.parse(value) as CartItem[]) : [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

async function saveStored(items: CartItem[]): Promise<void> {
  const value = JSON.stringify(items);
  if (isNativePlatform()) {
    await Preferences.set({ key: STORAGE_KEY, value });
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, value);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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

  const addToCart = (product: ShopProduct, quantity = 1) => {
    const productId = (product?._id ?? "").toString();
    if (!productId) return;
    const qty = Math.max(1, Math.floor(Number(quantity ?? 1)));
    setItems((prev) => {
      const idx = prev.findIndex((x) => (x.product?._id ?? "").toString() === productId);
      if (idx === -1) return [...prev, { product: { ...product, _id: productId }, quantity: qty }];
      const next = prev.slice();
      next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      return next;
    });
  };

  const removeFromCart = (productId: string) => {
    const pid = (productId ?? "").toString();
    setItems((prev) => prev.filter((x) => (x.product?._id ?? "").toString() !== pid));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const pid = (productId ?? "").toString();
    const qty = Math.max(0, Math.floor(Number(quantity ?? 0)));
    setItems((prev) => {
      if (qty === 0) return prev.filter((x) => (x.product?._id ?? "").toString() !== pid);
      const idx = prev.findIndex((x) => (x.product?._id ?? "").toString() === pid);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], quantity: qty };
      return next;
    });
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(
    () => items.reduce((acc, it) => acc + Math.max(0, Number(it.quantity ?? 0)), 0),
    [items],
  );

  const totalAmount = useMemo(
    () =>
      items.reduce((acc, it) => {
        const price = Number(it.product?.price ?? 0);
        const qty = Math.max(0, Number(it.quantity ?? 0));
        return acc + price * qty;
      }, 0),
    [items],
  );

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

