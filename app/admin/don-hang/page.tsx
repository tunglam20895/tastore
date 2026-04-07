"use client";

import { useEffect, useState, useCallback } from "react";
import OrderTable from "@/components/admin/OrderTable";
import Pagination from "@/components/admin/Pagination";
import type { DonHang } from "@/types";

const LIMIT = 20;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [trangThai, setTrangThai] = useState("");
  const [searchTen, setSearchTen] = useState("");
  const [searchTenInput, setSearchTenInput] = useState("");
  const [searchSdt, setSearchSdt] = useState("");
  const [searchSdtInput, setSearchSdtInput] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const loadOrders = useCallback((
    p = 1,
    tt = trangThai,
    ten = searchTen,
    sdt = searchSdt,
    tu = tuNgay,
    den = denNgay
  ) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (tt) params.set("trang_thai", tt);
    if (ten) params.set("search_ten", ten);
    if (sdt) params.set("search_sdt", sdt);
    if (tu) params.set("tu_ngay", tu);
    if (den) params.set("den_ngay", den);
    fetch(`/api/don-hang?${params}`, { headers: { "x-admin-password": adminPassword || "" } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data);
          setTotal(data.total ?? data.data.length);
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword, trangThai, searchTen, searchSdt, tuNgay, denNgay]);

  useEffect(() => { loadOrders(1); }, [loadOrders]);

  const handleTrangThaiChange = (tt: string) => {
    setTrangThai(tt);
    loadOrders(1, tt, searchTen, searchSdt, tuNgay, denNgay);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTen(searchTenInput);
    setSearchSdt(searchSdtInput);
    loadOrders(1, trangThai, searchTenInput, searchSdtInput, tuNgay, denNgay);
  };

  const handleDateChange = (tu: string, den: string) => {
    setTuNgay(tu);
    setDenNgay(den);
    loadOrders(1, trangThai, searchTen, searchSdt, tu, den);
  };

  const handleReset = () => {
    setTrangThai(""); setSearchTen(""); setSearchTenInput("");
    setSearchSdt(""); setSearchSdtInput(""); setTuNgay(""); setDenNgay("");
    loadOrders(1, "", "", "", "", "");
  };

  const hasFilters = trangThai || searchTen || searchSdt || tuNgay || denNgay;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-light text-espresso">Quản lý đơn hàng</h1>
        <button
          onClick={() => loadOrders(page)}
          className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-6">
        <input
          value={searchTenInput}
          onChange={(e) => setSearchTenInput(e.target.value)}
          placeholder="Tìm tên khách hàng..."
          className="px-3 py-1.5 border border-stone-300 rounded text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-44"
        />
        <input
          value={searchSdtInput}
          onChange={(e) => setSearchSdtInput(e.target.value)}
          placeholder="Tìm SĐT..."
          className="px-3 py-1.5 border border-stone-300 rounded text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-36"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400">Từ</span>
          <input type="date" value={tuNgay} onChange={(e) => handleDateChange(e.target.value, denNgay)}
            className="px-2 py-1.5 border border-stone-300 rounded text-xs text-espresso focus:outline-none focus:border-espresso bg-white" />
          <span className="text-xs text-stone-400">đến</span>
          <input type="date" value={denNgay} onChange={(e) => handleDateChange(tuNgay, e.target.value)}
            className="px-2 py-1.5 border border-stone-300 rounded text-xs text-espresso focus:outline-none focus:border-espresso bg-white" />
        </div>
        <button type="submit" className="px-4 py-1.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80">
          Tìm
        </button>
        {hasFilters && (
          <button type="button" onClick={handleReset}
            className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-500 hover:text-espresso">
            Xóa lọc
          </button>
        )}
      </form>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "Mới", "Đang xử lý", "Đã giao", "Huỷ"].map((status) => (
          <button
            key={status}
            onClick={() => handleTrangThaiChange(status)}
            className={`px-4 py-1.5 text-xs uppercase tracking-widest transition-all border ${
              trangThai === status
                ? "bg-espresso text-cream border-espresso"
                : "bg-transparent text-stone-600 border-stone-300 hover:border-espresso hover:text-espresso"
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
        <div className="bg-white border border-stone-300 rounded-xl shadow-md overflow-hidden">
          <OrderTable orders={orders} onStatusChange={() => loadOrders(page)} />
          <div className="px-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={(p) => loadOrders(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
