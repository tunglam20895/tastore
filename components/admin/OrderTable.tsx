"use client";

import { useState } from "react";
import type { DonHang } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  "Mới": "bg-blue-50 text-blue-700",
  "Đang xử lý": "bg-amber-50 text-amber-700",
  "Đã giao": "bg-green-50 text-green-700",
  "Huỷ": "bg-red-50 text-red-500",
};

export default function OrderTable({
  orders,
  onStatusChange,
}: {
  orders: DonHang[];
  onStatusChange: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, status: string) => {
    const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/don-hang/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ trangThai: status }),
      });
      const data = await res.json();
      if (data.success) onStatusChange();
      else alert(data.error);
    } catch {
      alert("Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  if (orders.length === 0) {
    return <div className="text-center py-12 text-stone-400 text-sm">Chưa có đơn hàng nào</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-widest text-stone-400">
            <th className="text-left py-3 px-4">Mã đơn</th>
            <th className="text-left py-3 px-4">Khách hàng</th>
            <th className="text-left py-3 px-4">SĐT</th>
            <th className="text-left py-3 px-4">Tạm tính</th>
            <th className="text-left py-3 px-4">Mã KM</th>
            <th className="text-left py-3 px-4">Giảm</th>
            <th className="text-left py-3 px-4">Tổng</th>
            <th className="text-left py-3 px-4">Thời gian</th>
            <th className="text-left py-3 px-4">Trạng thái</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const tamTinh = order.tongTien + order.giaTriGiam;
            return (
              <>
                <tr
                  key={order.id}
                  className="border-b border-stone-100 hover:bg-cream/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <td className="py-3 px-4 font-mono text-xs text-rose">{order.id}</td>
                  <td className="py-3 px-4 font-medium text-espresso">{order.tenKH}</td>
                  <td className="py-3 px-4 text-stone-500">{order.sdt}</td>
                  <td className="py-3 px-4 text-stone-400 text-xs">
                    {order.giaTriGiam > 0 ? `${tamTinh.toLocaleString("vi-VN")}đ` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {order.maGiamGia ? (
                      <span className="text-xs bg-blush text-espresso px-2 py-0.5 font-mono">
                        {order.maGiamGia}
                      </span>
                    ) : (
                      <span className="text-stone-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-rose text-xs">
                    {order.giaTriGiam > 0 ? `-${order.giaTriGiam.toLocaleString("vi-VN")}đ` : "—"}
                  </td>
                  <td className="py-3 px-4 font-medium text-espresso">
                    {order.tongTien.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="py-3 px-4 text-stone-400 text-xs">
                    {new Date(order.thoiGian).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.trangThai}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className={`text-xs font-medium px-3 py-1 border-0 cursor-pointer rounded ${
                        STATUS_COLORS[order.trangThai] || "bg-stone-100 text-stone-600"
                      }`}
                    >
                      <option value="Mới">Mới</option>
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đã giao">Đã giao</option>
                      <option value="Huỷ">Huỷ</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-stone-300 text-xs">
                    {expanded === order.id ? "▲" : "▼"}
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr key={`${order.id}-detail`} className="bg-cream/30">
                    <td colSpan={10} className="px-6 py-4">
                      <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Sản phẩm</p>
                      <div className="space-y-2">
                        {order.sanPham.map((sp, i) => (
                          <div key={i} className="flex justify-between text-sm text-stone-600">
                            <span>
                              {sp.ten} ×{sp.soLuong}
                              {sp.phanTramGiam && sp.phanTramGiam > 0 && (
                                <span className="ml-2 text-xs text-stone-400 line-through">
                                  {sp.giaGoc.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-espresso">
                              {(sp.giaHienThi * sp.soLuong).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-3">Địa chỉ: {order.diaChi}</p>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
