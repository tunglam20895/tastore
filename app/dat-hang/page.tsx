"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import OrderForm from "@/components/shop/OrderForm";

type CouponResult = {
  giaTriGiam: number;
  ma: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [ready, setReady] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (cart.length === 0) { router.push("/gio-hang"); return; }
    setReady(true);
  }, [cart.length, router]);

  const tamTinh = cart.reduce((sum, item) => sum + item.giaHienThi * item.soLuong, 0);
  const tongTienSauGiam = Math.max(0, tamTinh - (coupon?.giaTriGiam ?? 0));

  if (!ready) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCoupon(null);
    try {
      const res = await fetch("/api/ma-giam-gia/kiem-tra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ma: couponCode, tongTien: tamTinh }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupon({ giaTriGiam: data.data.giaTriGiam, ma: data.data.maInfo.ma });
      } else {
        setCouponError(data.error || "Mã không hợp lệ");
      }
    } catch {
      setCouponError("Không thể kiểm tra mã");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pt-32">
      <h2 className="font-heading text-3xl font-light text-espresso mb-10">Đặt Hàng</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Shipping form */}
        <div className="order-2 lg:order-1">
          <h3 className="text-xs uppercase tracking-widest text-rose mb-8">Thông Tin Giao Hàng</h3>
          <OrderForm
            cart={cart}
            total={tamTinh}
            onClearCart={clearCart}
            maGiamGia={coupon?.ma}
            giaTriGiam={coupon?.giaTriGiam}
          />
        </div>

        {/* Order summary */}
        <div className="order-1 lg:order-2">
          <h3 className="text-xs uppercase tracking-widest text-rose mb-8">Tóm Tắt Đơn Hàng</h3>
          <div className="bg-blush/20 p-6">
            {/* Cart items */}
            <div className="space-y-5 mb-6">
              {cart.map((item) => (
                <div key={`${item.id}_${item.sizeChon ?? ""}`} className="flex items-start gap-4">
                  <div className="relative w-14 flex-shrink-0 overflow-hidden bg-blush" style={{ aspectRatio: "3/4" }}>
                    {item.anhURL ? (
                      <Image src={item.anhURL} alt={item.ten} fill className="object-cover" />
                    ) : (
                      <div className="h-full bg-blush" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-espresso font-light leading-snug line-clamp-2">{item.ten}</p>
                    {item.sizeChon && <p className="text-xs text-stone mt-0.5">Size: {item.sizeChon}</p>}
                    <p className="text-xs text-stone mt-0.5">×{item.soLuong}</p>
                  </div>
                  <span className="text-sm font-medium text-espresso whitespace-nowrap">
                    {(item.giaHienThi * item.soLuong).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-blush mb-4" />

            {/* Coupon input */}
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-stone mb-2">Mã Giảm Giá</p>
              {coupon ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>Mã {coupon.ma}: Giảm {coupon.giaTriGiam.toLocaleString("vi-VN")}đ</span>
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-stone text-xs hover:text-rose transition-colors ml-2"
                    aria-label="Xóa mã"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Nhập mã..."
                    className="flex-1 bg-transparent border-b border-stone-300 py-1.5 px-0 text-espresso text-xs focus:outline-none focus:border-espresso transition-colors uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="text-xs uppercase tracking-widest text-espresso border border-espresso/30 px-3 py-1.5 hover:bg-espresso hover:text-cream transition-all disabled:opacity-40"
                  >
                    {couponLoading ? "..." : "Áp Dụng"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-rose mt-1.5 flex items-center gap-1">
                  <span>✕</span> {couponError}
                </p>
              )}
            </div>

            <div className="w-full h-px bg-blush mb-4" />

            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-stone">
                <span>Tạm tính</span>
                <span>{tamTinh.toLocaleString("vi-VN")}đ</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone">Mã {coupon.ma}</span>
                  <span className="text-rose">-{coupon.giaTriGiam.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-stone">
                <span>Phí ship</span>
                <span className="text-espresso">Miễn phí</span>
              </div>
            </div>

            <div className="w-full h-px bg-blush mb-4" />

            <div className="flex justify-between font-medium text-espresso">
              <span>Tổng</span>
              <span>{tongTienSauGiam.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
