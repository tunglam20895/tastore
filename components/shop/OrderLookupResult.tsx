"use client";

import { useTrangThaiDH, getTrangThaiMau, getStatusBadgeStyle } from "@/contexts/TrangThaiDHContext";
import type { DonHang } from "@/types";

function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortOrderId(id: string): string {
  // e.g. dh_1706789012345 -> #DH...2345
  const suffix = id.slice(-6).toUpperCase();
  return `#DH${suffix}`;
}

interface OrderLookupResultProps {
  orders: DonHang[];
}

export default function OrderLookupResult({ orders }: OrderLookupResultProps) {
  const { trangThais } = useTrangThaiDH();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-stone-300 text-5xl mb-4">📦</div>
        <p className="text-stone-500 text-sm">Không tìm thấy đơn hàng nào</p>
        <p className="text-stone-400 text-xs mt-1">Vui lòng kiểm tra lại số điện thoại</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 mb-4">
        Tìm thấy <span className="font-medium text-espresso">{orders.length}</span> đơn hàng
      </p>

      {orders.map((order) => {
        const statusMau = getTrangThaiMau(trangThais, order.trangThai);
        const badgeStyle = getStatusBadgeStyle(statusMau);

        return (
          <div
            key={order.id}
            className="bg-white border border-stone-200/60 shadow-sm overflow-hidden"
          >
            {/* Header đơn hàng */}
            <div className="flex items-center justify-between px-4 py-3 bg-cream/40 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-espresso font-medium">
                  {getShortOrderId(order.id)}
                </span>
                <span
                  className="text-[11px] font-medium px-2.5 py-0.5 border"
                  style={badgeStyle}
                >
                  {order.trangThai}
                </span>
              </div>
              <span className="text-xs text-stone-400">{formatDate(order.thoiGian)}</span>
            </div>

            {/* Sản phẩm */}
            <div className="px-4 py-3">
              {order.sanPham.map((sp, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-start gap-3">
                    {sp.anhURL && (
                      <img
                        src={sp.anhURL}
                        alt={sp.ten}
                        className="w-12 h-16 object-cover bg-stone-100 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-espresso">{sp.ten}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sp.sizeChon && (
                          <span className="text-[10px] bg-blush/30 text-stone-600 px-1.5 py-0.5">
                            {sp.sizeChon}
                          </span>
                        )}
                        <span className="text-xs text-stone-400">×{sp.soLuong}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-espresso shrink-0 ml-4">
                    {formatMoney(sp.giaHienThi * sp.soLuong)}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer tổng tiền */}
            <div className="flex items-center justify-between px-4 py-3 bg-cream/40 border-t border-stone-100">
              <span className="text-xs text-stone-500">Tổng cộng</span>
              <span className="text-base font-semibold text-espresso">
                {formatMoney(order.tongTien)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
