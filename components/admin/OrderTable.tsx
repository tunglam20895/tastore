"use client";

import { useState } from "react";
import type { DonHang } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { useTrangThaiDH, getStatusBadgeStyle } from "@/contexts/TrangThaiDHContext";

export default function OrderTable({
  orders,
  selectedIds,
  onSelectChange,
  onStatusChange,
}: {
  orders: DonHang[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onStatusChange: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { trangThais } = useTrangThaiDH();

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/don-hang/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ trangThai: status }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Đã chuyển trạng thái: ${status}`);
        onStatusChange();
      }
      else showError(data.error || "Cập nhật thất bại");
    } catch {
      showError("Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const allChecked = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id));
  const someChecked = orders.some((o) => selectedIds.includes(o.id));

  const toggleAll = () => {
    if (allChecked) {
      onSelectChange(selectedIds.filter((id) => !orders.find((o) => o.id === id)));
    } else {
      const combined = selectedIds.concat(orders.map((o) => o.id));
      const newIds = combined.filter((id, i) => combined.indexOf(id) === i);
      onSelectChange(newIds);
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  if (orders.length === 0) {
    return <div className="text-center py-12 text-stone-400 text-sm">Chưa có đơn hàng nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-100/50 text-xs uppercase tracking-widest text-stone-600 font-medium">
            <th className="py-3 px-3 w-10">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                onChange={toggleAll}
                className="cursor-pointer accent-espresso"
              />
            </th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Mã đơn</th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Khách hàng</th>
            <th className="text-left py-3 px-4">Địa chỉ</th>
            <th className="text-left py-3 px-4">Sản phẩm</th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Tổng tiền</th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Ngày mua</th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Người xử lý</th>
            <th className="text-left py-3 px-4 whitespace-nowrap">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={`border-b border-stone-200 hover:bg-stone-50 transition-colors align-top ${
                selectedIds.includes(order.id) ? "bg-purple-50/30" : ""
              }`}
            >
              {/* Checkbox */}
              <td className="py-3 px-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(order.id)}
                  onChange={() => toggleOne(order.id)}
                  className="cursor-pointer accent-espresso"
                />
              </td>

              {/* Mã đơn */}
              <td className="py-3 px-4 font-mono text-xs text-rose whitespace-nowrap">
                {order.id}
              </td>

              {/* Khách hàng: tên + SĐT */}
              <td className="py-3 px-4 whitespace-nowrap">
                <p className="font-medium text-espresso">{order.tenKH}</p>
                <p className="text-xs text-stone-500 mt-0.5">{order.sdt}</p>
              </td>

              {/* Địa chỉ */}
              <td className="py-3 px-4 text-xs text-stone-500 max-w-[180px]">
                {order.diaChi}
              </td>

              {/* Sản phẩm */}
              <td className="py-3 px-4 min-w-[200px]">
                <div className="space-y-1">
                  {order.sanPham.map((sp, i) => (
                    <div key={i} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs">
                      <span className="font-medium text-espresso">{sp.ten}</span>
                      {sp.sizeChon && (
                        <span className="bg-blush text-espresso px-1.5 py-0.5 text-[10px]">
                          {sp.sizeChon}
                        </span>
                      )}
                      <span className="text-stone-400">×{sp.soLuong}</span>
                      {sp.phanTramGiam && sp.phanTramGiam > 0 && (
                        <span className="text-stone-300 line-through">
                          {sp.giaGoc.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                      <span className="text-rose font-medium">
                        {(sp.giaHienThi * sp.soLuong).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                  {order.maGiamGia && (
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Mã KM: <span className="font-mono text-espresso">{order.maGiamGia}</span>
                      {order.giaTriGiam > 0 && (
                        <span className="text-rose ml-1">
                          −{order.giaTriGiam.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </td>

              {/* Tổng tiền */}
              <td className="py-3 px-4 font-medium text-espresso whitespace-nowrap">
                {order.tongTien.toLocaleString("vi-VN")}đ
              </td>

              {/* Ngày mua */}
              <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                {new Date(order.thoiGian).toLocaleDateString("vi-VN")}<br />
                <span className="text-stone-400">
                  {new Date(order.thoiGian).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </td>

              {/* Người xử lý */}
              <td className="py-3 px-4 text-xs whitespace-nowrap">
                {order.nguoiXuLy && order.nguoiXuLy !== 'Chưa có' ? (
                  <span className="font-medium text-teal-600">{order.nguoiXuLy}</span>
                ) : (
                  <span className="text-stone-400 italic">Chưa có</span>
                )}
              </td>

              {/* Trạng thái */}
              <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                <select
                  value={order.trangThai}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updating === order.id}
                  className="text-xs font-medium px-3 py-1 border-0 cursor-pointer rounded"
                  style={getStatusBadgeStyle(
                    trangThais.find((t) => t.key === order.trangThai)?.mau || "#6B7280"
                  )}
                >
                  {trangThais.map((tt) => (
                    <option key={tt.key} value={tt.key}>{tt.ten}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
