"use client";

import { useState } from "react";
import type { DonHang } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import OrderLookupResult from "@/components/shop/OrderLookupResult";
import { useToast } from "@/contexts/ToastContext";

export default function TraCuuDonHangPage() {
  const [sdt, setSdt] = useState("");
  const [orders, setOrders] = useState<DonHang[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { showToast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSdt = sdt.trim();
    if (!trimmedSdt) {
      showToast("Vui lòng nhập số điện thoại", "error");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch("/api/tra-cuu-don-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdt: trimmedSdt }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        showToast(data.error || "Có lỗi xảy ra", "error");
        setOrders(null);
      }
    } catch {
      showToast("Không thể kết nối đến máy chủ", "error");
      setOrders(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream pt-24 md:pt-32 pb-16">
      <div className="max-w-xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="font-heading text-2xl md:text-3xl font-light text-espresso tracking-widest uppercase">
            Tra Cứu Đơn Hàng
          </h1>
          <p className="text-sm text-stone-400 mt-2 tracking-wider">
            Nhập số điện thoại để kiểm tra đơn hàng của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="input-group">
            <input
              id="sdt-input"
              type="tel"
              value={sdt}
              onChange={(e) => setSdt(e.target.value.replace(/[^\d]/g, ""))}
              className="input-underline w-full py-3 text-center text-lg tracking-widest text-espresso outline-none"
              placeholder="Số điện thoại"
              maxLength={15}
              autoComplete="tel"
            />
            <label
              htmlFor="sdt-input"
              className="label-float"
            >
              Số điện thoại
            </label>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tra cứu...
                </>
              ) : (
                "Tra cứu"
              )}
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" label="Đang tra cứu..." />
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <OrderLookupResult orders={orders || []} />
        )}

        {/* Empty initial state */}
        {!loading && !hasSearched && (
          <div className="text-center py-12">
            <div className="text-stone-200 text-6xl mb-4">📋</div>
            <p className="text-stone-400 text-sm">Nhập số điện thoại của bạn để tra cứu đơn hàng</p>
          </div>
        )}
      </div>
    </div>
  );
}
