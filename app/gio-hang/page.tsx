"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CartItem as CartItemType } from "@/types";
import CartItem from "@/components/shop/CartItem";

function EmptyBagIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone/30 mx-auto mb-6">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemType[]>([]);

  const loadCart = useCallback(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const items: CartItemType[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const item = items.find((i) => i.id === id);
    if (item) {
      item.soLuong = quantity;
      localStorage.setItem("cart", JSON.stringify(items));
      loadCart();
    }
  }, [loadCart]);

  const removeItem = useCallback((id: string) => {
    const items: CartItemType[] = JSON.parse(localStorage.getItem("cart") || "[]");
    localStorage.setItem("cart", JSON.stringify(items.filter((i) => i.id !== id)));
    loadCart();
  }, [loadCart]);

  const total = cart.reduce((sum, item) => sum + item.giaHienThi * item.soLuong, 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 pt-36 text-center">
        <EmptyBagIcon />
        <h2 className="font-heading text-3xl font-light text-espresso mb-3">Giỏ Hàng Trống</h2>
        <p className="text-sm text-stone mb-10">Hãy thêm sản phẩm yêu thích vào giỏ hàng của bạn</p>
        <button
          onClick={() => router.push("/")}
          className="btn-primary"
        >
          Tiếp Tục Mua Sắm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pt-32">
      <h2 className="font-heading text-3xl font-light text-espresso mb-10">
        Giỏ Hàng
        <span className="text-base font-sans font-normal text-stone ml-3">({cart.length} sản phẩm)</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2">
          {cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdate={(q) => updateQuantity(item.id, q)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          <button
            onClick={() => router.push("/")}
            className="mt-8 text-xs uppercase tracking-widest text-stone hover:text-espresso transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Tiếp Tục Mua Sắm</span>
          </button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-blush/20 p-6 sticky top-28">
            <h3 className="text-xs uppercase tracking-widest text-stone mb-6">Đơn Hàng</h3>

            <div className="flex justify-between text-sm text-stone mb-3">
              <span>Tạm tính</span>
              <span>{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between text-sm text-stone mb-6 pb-6 border-b border-blush">
              <span>Phí ship</span>
              <span className="text-espresso">Miễn phí</span>
            </div>
            <div className="flex justify-between font-medium text-espresso text-base mb-8">
              <span>Tổng</span>
              <span>{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <button
              onClick={() => router.push("/dat-hang")}
              className="btn-primary w-full text-center"
            >
              Đặt Hàng Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
