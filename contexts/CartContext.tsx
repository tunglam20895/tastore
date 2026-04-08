"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem as CartItemType } from "@/types";

type FlyTrigger = {
  startX: number;
  startY: number;
  imageUrl?: string;
  id: number; // unique để re-trigger
};

type CartContextType = {
  cart: CartItemType[];
  cartCount: number;
  addItem: (item: CartItemType) => void;
  updateQuantity: (id: string, sizeChon: string | null, quantity: number) => void;
  removeItem: (id: string, sizeChon: string | null) => void;
  clearCart: () => void;
  refreshCart: () => void;
  triggerFly: (startX: number, startY: number, imageUrl?: string) => void;
  flyTrigger: FlyTrigger | null;
  flyDone: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "cart";
let flyId = 0;

function loadCart(): CartItemType[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart: CartItemType[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [flyTrigger, setFlyTrigger] = useState<FlyTrigger | null>(null);

  // Load từ localStorage khi mount
  useEffect(() => {
    setCart(loadCart());
  }, []);

  // Lắng nghe storage event (khi mở nhiều tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(loadCart());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.soLuong, 0);

  const refreshCart = useCallback(() => {
    setCart(loadCart());
  }, []);

  const triggerFly = useCallback((startX: number, startY: number, imageUrl?: string) => {
    setFlyTrigger({ startX, startY, imageUrl, id: ++flyId });
  }, []);

  const flyDone = useCallback(() => {
    setFlyTrigger(null);
  }, []);

  const addItem = useCallback((newItem: CartItemType) => {
    const items = loadCart();
    const existing = items.find(
      (i) => i.id === newItem.id && i.sizeChon === newItem.sizeChon
    );
    if (existing) {
      existing.soLuong += newItem.soLuong;
    } else {
      items.push(newItem);
    }
    saveCart(items);
    setCart([...items]);
  }, []);

  const updateQuantity = useCallback((id: string, sizeChon: string | null, quantity: number) => {
    const items = loadCart();
    const item = items.find((i) => i.id === id && i.sizeChon === sizeChon);
    if (item) {
      item.soLuong = quantity;
      saveCart(items);
      setCart([...items]);
    }
  }, []);

  const removeItem = useCallback((id: string, sizeChon: string | null) => {
    const items = loadCart();
    const filtered = items.filter((i) => !(i.id === id && i.sizeChon === sizeChon));
    saveCart(filtered);
    setCart([...filtered]);
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_KEY);
    setCart([]);
  }, []);

  return (
    <CartContext.Provider value={{ cart, cartCount, addItem, updateQuantity, removeItem, clearCart, refreshCart, triggerFly, flyTrigger, flyDone }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
