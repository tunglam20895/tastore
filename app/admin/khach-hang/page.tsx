"use client";

import { useEffect, useState, useCallback } from "react";
import type { KhachHang, TrangThaiKH, DonHang } from "@/types";
import Pagination from "@/components/admin/Pagination";

const LIMIT = 20;

function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN");
}

export default function AdminKhachHangPage() {
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [trangThaiList, setTrangThaiList] = useState<TrangThaiKH[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTT, setFilterTT] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modal
  const [selectedKH, setSelectedKH] = useState<KhachHang | null>(null);
  const [modalOrders, setModalOrders] = useState<DonHang[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editTrangThai, setEditTrangThai] = useState("");
  const [saving, setSaving] = useState(false);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";

  const loadTrangThai = useCallback(() => {
    fetch("/api/trang-thai-kh")
      .then((r) => r.json())
      .then((d) => { if (d.success) setTrangThaiList(d.data); })
      .catch(() => {});
  }, []);

  const loadCustomers = useCallback((p = 1, tt = "", s = "") => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (tt) params.set("trang_thai", tt);
    if (s) params.set("search", s);
    fetch(`/api/khach-hang?${params}`, { headers: { "x-admin-password": adminPassword || "" } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCustomers(d.data);
          setTotal(d.total);
          setTotalPages(d.totalPages);
          setPage(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useEffect(() => { loadTrangThai(); }, [loadTrangThai]);
  useEffect(() => { loadCustomers(1, filterTT, search); }, [loadCustomers, filterTT, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openModal = async (kh: KhachHang) => {
    setSelectedKH(kh);
    setEditGhiChu(kh.ghiChu || "");
    setEditTrangThai(kh.trangThai);
    setModalLoading(true);
    setModalOrders([]);
    try {
      const res = await fetch(`/api/don-hang?sdt=${encodeURIComponent(kh.sdt)}`, {
        headers: { "x-admin-password": adminPassword || "" },
      });
      const d = await res.json();
      if (d.success) {
        setModalOrders(d.data || []);
      }
    } catch { /* ignore */ }
    setModalLoading(false);
  };

  const handleSaveKH = async () => {
    if (!selectedKH) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/khach-hang/${encodeURIComponent(selectedKH.sdt)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ trangThai: editTrangThai, ghiChu: editGhiChu }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedKH(null);
        loadCustomers(page, filterTT, search);
      } else {
        alert(d.error);
      }
    } catch { alert("Không thể lưu"); }
    setSaving(false);
  };

  const getTrangThaiColor = (ten: string) => {
    return trangThaiList.find((t) => t.ten === ten)?.mau || "#8C7B72";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-light text-espresso">Khách hàng</h1>
          <p className="text-xs text-stone-400 mt-1">Tổng {total} khách hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm tên hoặc SĐT..."
            className="px-3 py-1.5 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-52"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            Tìm
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); }}
              className="px-3 py-1.5 border border-stone-200 text-xs text-stone-400 hover:text-espresso"
            >
              ×
            </button>
          )}
        </form>

        <select
          value={filterTT}
          onChange={(e) => { setFilterTT(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          {trangThaiList.map((t) => (
            <option key={t.id} value={t.ten}>{t.ten}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-stone-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-widest text-stone-400">
                <th className="text-left py-3 px-4">Tên khách hàng</th>
                <th className="text-left py-3 px-4">Số điện thoại</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-right py-3 px-4">Tổng đơn</th>
                <th className="text-right py-3 px-4">Doanh thu</th>
                <th className="text-left py-3 px-4">Ghi chú</th>
                <th className="text-left py-3 px-4">Lần cuối mua</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-stone-400">Chưa có khách hàng nào</td>
                </tr>
              ) : customers.map((kh) => (
                <tr key={kh.sdt} className="border-b border-stone-50 hover:bg-cream/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-espresso">{kh.ten}</td>
                  <td className="py-3 px-4 text-stone-500">{kh.sdt}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-sm"
                      style={{ backgroundColor: getTrangThaiColor(kh.trangThai) + "22", color: getTrangThaiColor(kh.trangThai) }}
                    >
                      {kh.trangThai}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-stone-600">{kh.tongDon}</td>
                  <td className="py-3 px-4 text-right font-medium text-espresso">{formatMoney(kh.tongDoanhThu)}</td>
                  <td className="py-3 px-4 text-stone-400 text-xs max-w-[160px] truncate">{kh.ghiChu || "—"}</td>
                  <td className="py-3 px-4 text-stone-400 text-xs">{formatDate(kh.updatedAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openModal(kh)}
                      className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={(p) => loadCustomers(p, filterTT, search)}
            />
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedKH && (
        <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div>
                <h2 className="font-heading text-xl font-light text-espresso">{selectedKH.ten}</h2>
                <p className="text-xs text-stone-400 mt-0.5">{selectedKH.sdt}</p>
              </div>
              <button
                onClick={() => setSelectedKH(null)}
                className="text-stone-400 hover:text-espresso text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Edit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Trạng thái</label>
                  <select
                    value={editTrangThai}
                    onChange={(e) => setEditTrangThai(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
                  >
                    {trangThaiList.map((t) => (
                      <option key={t.id} value={t.ten}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Ghi chú</label>
                  <input
                    value={editGhiChu}
                    onChange={(e) => setEditGhiChu(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
                    placeholder="Ghi chú về khách..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveKH}
                  disabled={saving}
                  className="px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => setSelectedKH(null)}
                  className="px-5 py-2 border border-stone-200 text-xs uppercase tracking-widest text-stone-400 hover:text-espresso hover:border-espresso transition-colors"
                >
                  Huỷ
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-100">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-widest">Tổng đơn</p>
                  <p className="text-2xl font-light text-espresso mt-1">{selectedKH.tongDon}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-widest">Doanh thu</p>
                  <p className="text-2xl font-light text-espresso mt-1">{formatMoney(selectedKH.tongDoanhThu)}</p>
                </div>
              </div>

              {/* Order history */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-400 mb-3">Lịch sử đơn hàng</h3>
                {modalLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-espresso border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : modalOrders.length === 0 ? (
                  <p className="text-sm text-stone-400">Chưa có đơn hàng nào</p>
                ) : (
                  <div className="space-y-2">
                    {modalOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-cream/50 border border-stone-100 text-sm">
                        <div>
                          <span className="font-medium text-espresso">{o.id}</span>
                          <span className="text-stone-400 ml-3 text-xs">{formatDate(o.thoiGian)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-espresso">{formatMoney(o.tongTien)}</span>
                          <span className={`text-xs px-2 py-0.5 ${
                            o.trangThai === "Đã giao" ? "bg-green-50 text-green-600" :
                            o.trangThai === "Huỷ" ? "bg-red-50 text-red-500" :
                            o.trangThai === "Đang xử lý" ? "bg-amber-50 text-amber-600" :
                            "bg-stone-50 text-stone-500"
                          }`}>
                            {o.trangThai}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
