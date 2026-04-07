"use client";

import { useEffect, useState, useCallback } from "react";
import type { DonHang } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, newOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const loadStats = useCallback(() => {
    Promise.all([
      fetch("/api/san-pham").then((r) => r.json()),
      fetch("/api/don-hang", { headers: { "x-admin-password": adminPassword || "" } }).then((r) => r.json()),
    ])
      .then(([products, orders]) => {
        const orderData: DonHang[] = orders.success ? orders.data : [];
        setStats({
          totalProducts: products.success ? products.data.length : 0,
          totalOrders: orderData.length,
          newOrders: orderData.filter((o) => o.trangThai === "Mới").length,
          totalRevenue: orderData.filter((o) => o.trangThai === "Đã giao").reduce((sum, o) => sum + o.tongTien, 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const cards = [
    { label: "Sản phẩm", value: stats.totalProducts, accent: "border-blush" },
    { label: "Đơn hàng mới", value: stats.newOrders, accent: "border-rose" },
    { label: "Tổng đơn hàng", value: stats.totalOrders, accent: "border-stone-300" },
    { label: "Doanh thu (đã giao)", value: `${stats.totalRevenue.toLocaleString("vi-VN")}đ`, accent: "border-espresso" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-light text-espresso mb-8">Dashboard</h1>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={`bg-white p-6 border-t-2 ${card.accent}`}>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">{card.label}</p>
              <p className="font-heading text-3xl font-light text-espresso">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
