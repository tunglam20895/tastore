"use client";

import { useEffect, useState } from "react";
import type { DonHang } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { getTrangThaiMau, getStatusBadgeStyle, useTrangThaiDH } from "@/contexts/TrangThaiDHContext";

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
  const { showSuccess, showError } = useToast();
  const { trangThais } = useTrangThaiDH();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/don-hang/${orderId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); })
      .catch((err) => { if (err.name !== "AbortError") {} })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [orderId]);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/don-hang/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trangThai: status }),
      });
      const d = await res.json();
      if (d.success) {
        showSuccess("Cập nhật trạng thái đơn hàng thành công!");
        setOrder((o) => o ? { ...o, trangThai: status as DonHang["trangThai"] } : o);
        onStatusChange?.();
      } else {
        showError(d.error || "Cập nhật thất bại");
      }
    } catch {
      showError("Không thể cập nhật trạng thái");
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
        className="bg-white w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-heading text-base sm:text-lg font-light text-espresso">Chi tiết đơn hàng</h2>
            {order && <p className="font-mono text-xs text-rose mt-0.5">{order.id}</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-espresso text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" label="Đang tải..." />
          </div>
        ) : !order ? (
          <div className="py-16 text-center text-stone-400 text-sm">Không tìm thấy đơn hàng</div>
        ) : (
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

            {/* Trạng thái + thời gian + người xử lý */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-3 py-1"
                  style={getStatusBadgeStyle(getTrangThaiMau(trangThais, order.trangThai))}
                >
                  {order.trangThai}
                </span>
                {order.nguoiXuLy && order.nguoiXuLy !== 'Chưa có' ? (
                  <span className="text-xs font-medium text-teal-600">👤 {order.nguoiXuLy}</span>
                ) : (
                  <span className="text-xs text-stone-400 italic">Chưa có người xử lý</span>
                )}
              </div>
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
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                    {/* Ảnh sản phẩm */}
                    <div className="w-16 h-20 shrink-0 bg-cream/50 border border-stone-100 rounded overflow-hidden">
                      {sp.anhURL ? (
                        <img
                          src={sp.anhURL}
                          alt={sp.ten}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
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
                      <p className="text-sm font-medium text-espresso mt-1">
                        {formatMoney(sp.giaHienThi * sp.soLuong)}
                      </p>
                    </div>
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
                {trangThais.map((tt) => (
                  <button
                    key={tt.key}
                    onClick={() => handleStatusChange(tt.key)}
                    disabled={updating || order.trangThai === tt.key}
                    className={`py-2 text-xs uppercase tracking-widest transition-all border ${
                      order.trangThai === tt.key
                        ? "bg-espresso text-cream border-espresso"
                        : "text-stone-600 border-stone-200 hover:border-espresso hover:text-espresso"
                    } disabled:opacity-50`}
                  >
                    {tt.ten}
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
