"use client";

import { useEffect, useState, useCallback } from "react";
import OrderTable from "@/components/admin/OrderTable";
import type { DonHang } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const loadOrders = useCallback(() => {
    fetch("/api/don-hang", { headers: { "x-admin-password": adminPassword || "" } })
      .then((res) => res.json())
      .then((data) => { if (data.success) setOrders(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filteredOrders = filter ? orders.filter((o) => o.trangThai === filter) : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-light text-espresso">Quản lý đơn hàng</h1>
        <button
          onClick={loadOrders}
          className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "Mới", "Đang xử lý", "Đã giao", "Huỷ"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 text-xs uppercase tracking-widest transition-all border ${
              filter === status
                ? "bg-espresso text-cream border-espresso"
                : "bg-transparent text-stone-400 border-stone-200 hover:border-espresso hover:text-espresso"
            }`}
          >
            {status || "Tất cả"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-stone-100">
          <OrderTable orders={filteredOrders} onStatusChange={loadOrders} />
        </div>
      )}
    </div>
  );
}
