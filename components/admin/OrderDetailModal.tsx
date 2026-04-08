"use client";

import { useEffect, useState } from "react";
import type { DonHang } from "@/types";
import { useToast } from "@/contexts/ToastContext";

const STATUS_COLORS: Record<string, string> = {
  "Mới": "bg-blue-50 text-blue-700",
  "Đang xử lý": "bg-amber-50 text-amber-700",
  "Đã giao": "bg-green-50 text-green-700",
  "Huỷ": "bg-red-50 text-red-500",
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("vi-VN") + " lúc " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  orderId: string;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function OrderDetailModal({ orderId, onClose, onStatusChange }: Props) {
  const [order, setOrder] = useState<DonHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/don-hang/${orderId}`, {
      headers: { "x-admin-password": adminPassword || "" },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, adminPassword]);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/don-hang/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ trangThai: status }),
      });
      const d = await res.json();
      if (d.success) {
        setOrder((o) => o ? { ...o, trangThai: status as DonHang["trangThai"] } : o);
        onStatusChange?.();
      } else {
        showToast(d.error || "Cập nhật thất bại");
      }
    } catch {
      showToast("Không thể cập nhật trạng thái");
    }
    setUpdating(false);
  };

  // Đóng khi bấm Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-heading text-lg font-light text-espresso">Chi tiết đơn hàng</h2>
            {order && <p className="font-mono text-xs text-rose mt-0.5">{order.id}</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-espresso text-2xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !order ? (
          <div className="py-16 text-center text-stone-400 text-sm">Không tìm thấy đơn hàng</div>
        ) : (
          <div className="px-6 py-5 space-y-5">

            {/* Trạng thái + thời gian */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-3 py-1 ${STATUS_COLORS[order.trangThai] || "bg-stone-100 text-stone-600"}`}>
                {order.trangThai}
              </span>
              <span className="text-xs text-stone-400">{formatDateTime(order.thoiGian)}</span>
            </div>

            {/* Thông tin khách */}
            <div className="bg-cream/60 px-4 py-3 space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Khách hàng</p>
              <p className="font-medium text-espresso">{order.tenKH}</p>
              <p className="text-sm text-stone-600">{order.sdt}</p>
              <p className="text-sm text-stone-600">{order.diaChi}</p>
            </div>

            {/* Sản phẩm */}
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Sản phẩm</p>
              <div className="space-y-2">
                {order.sanPham.map((sp, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-stone-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-espresso">{sp.ten}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sp.sizeChon && (
                          <span className="text-[10px] bg-blush/50 text-espresso px-1.5 py-0.5">{sp.sizeChon}</span>
                        )}
                        <span className="text-xs text-stone-400">×{sp.soLuong}</span>
                        {sp.phanTramGiam && sp.phanTramGiam > 0 && (
                          <span className="text-xs text-stone-300 line-through">{formatMoney(sp.giaGoc)}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-espresso shrink-0">
                      {formatMoney(sp.giaHienThi * sp.soLuong)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="border-t border-stone-200 pt-3 space-y-1.5">
              {order.maGiamGia && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Mã KM <span className="font-mono text-espresso">{order.maGiamGia}</span></span>
                  <span className="text-rose">−{formatMoney(order.giaTriGiam)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-espresso">Tổng cộng</span>
                <span className="text-lg font-semibold text-espresso">{formatMoney(order.tongTien)}</span>
              </div>
            </div>

            {/* Cập nhật trạng thái */}
            <div className="border-t border-stone-100 pt-4">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Cập nhật trạng thái</p>
              <div className="grid grid-cols-2 gap-2">
                {(["Mới", "Đang xử lý", "Đã giao", "Huỷ"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating || order.trangThai === s}
                    className={`py-2 text-xs uppercase tracking-widest transition-all border ${
                      order.trangThai === s
                        ? "bg-espresso text-cream border-espresso"
                        : "text-stone-600 border-stone-200 hover:border-espresso hover:text-espresso"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
