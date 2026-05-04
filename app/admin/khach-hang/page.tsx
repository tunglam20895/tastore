"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminChat } from "@/contexts/AdminChatContext";
import type { KhachHang, TrangThaiKH, DonHang } from "@/types";
import Pagination from "@/components/admin/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";

const LIMIT_DEFAULT = 20;

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
  const [limit, setLimit] = useState(LIMIT_DEFAULT);
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
  const { showSuccess, showError } = useToast();

  const loadTrangThai = useCallback((signal?: AbortSignal) => {
    fetch("/api/trang-thai-kh", { signal })
      .then((r) => r.json())
      .then((d) => { if (d.success) setTrangThaiList(d.data); })
      .catch((err) => { if (err.name !== "AbortError") {} });
  }, []);

  const loadCustomers = useCallback((p = 1, tt = "", s = "", signal?: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (tt) params.set("trang_thai", tt);
    if (s) params.set("search", s);
    fetch(`/api/khach-hang?${params}`, { signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCustomers(d.data);
          setTotal(d.total);
          setTotalPages(d.totalPages);
          setPage(p);
        }
      })
      .catch((err) => { if (err.name !== "AbortError") {} })
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    const controller = new AbortController();
    loadTrangThai(controller.signal);
    return () => controller.abort();
  }, [loadTrangThai]);

  useEffect(() => {
    const controller = new AbortController();
    loadCustomers(1, filterTT, search, controller.signal);
    return () => controller.abort();
  }, [loadCustomers, filterTT, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openModal = async (sdt: string) => {
    setModalLoading(true);
    setModalOrders([]);
    setSelectedKH(null);
    try {
      const res = await fetch(`/api/khach-hang/${encodeURIComponent(sdt)}`);
      const d = await res.json();
      if (d.success) {
        setSelectedKH(d.data.khachHang);
        setModalOrders(d.data.donHangs || []);
        setEditGhiChu(d.data.khachHang?.ghiChu || "");
        setEditTrangThai(d.data.khachHang?.trangThai || "");
      }
    } catch { /* ignore */ }
    setModalLoading(false);
  };

  // Escape key to close modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && selectedKH) setSelectedKH(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedKH]);

  const handleSaveKH = async () => {
    if (!selectedKH) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/khach-hang/${encodeURIComponent(selectedKH.sdt)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trangThai: editTrangThai, ghiChu: editGhiChu }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedKH(null);
        loadCustomers(page, filterTT, search);
      } else {
        showSuccess("Cập nhật thông tin khách hàng thành công!");
      }
    } catch { showError("Không thể lưu thông tin khách hàng"); }
    setSaving(false);
  };

  const getTrangThaiColor = (ten: string) => {
    return trangThaiList.find((t) => t.ten === ten)?.mau || "#8C7B72";
  };

  // ─── Push data to AdminChat context ────────────────────────────────────────
  const { setScreenData } = useAdminChat();

  useEffect(() => {
    if (!loading && customers.length >= 0) {
      const filters: string[] = [];
      if (filterTT) filters.push(`Trạng thái: ${filterTT}`);
      if (search) filters.push(`Tìm kiếm: "${search}"`);

      setScreenData({
        page: 'khach-hang',
        title: 'Quản lý khách hàng',
        summary: `Đang hiển thị ${customers.length} khách hàng (trang ${page}/${totalPages}). Tổng ${total} khách hàng.`,
        filters,
        stats: { 'Tổng KH': total, 'Đang hiển thị': customers.length },
        items: customers.map(kh =>
          `"${kh.ten}" (${kh.sdt}) | ${kh.tongDon} đơn | ${formatMoney(kh.tongDoanhThu)} | TT: ${kh.trangThai}${kh.ghiChu ? ` | Ghi chú: ${kh.ghiChu}` : ''}`
        ),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, filterTT, search, page, totalPages, total, loading]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso">Khách hàng</h1>
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
            className="px-3 py-1.5 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-full sm:w-52"
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
          <LoadingSpinner size="md" label="Đang tải..." />
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
                  <td className="py-3 px-4 text-stone-500">
                    <button
                      onClick={() => openModal(kh.sdt)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {kh.sdt}
                    </button>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => loadCustomers(p, filterTT, search)}
              onLimitChange={(l) => { setLimit(l); loadCustomers(1, filterTT, search); }}
            />
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedKH && (
        <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-light text-espresso">{selectedKH.ten}</h2>
                <p className="text-xs text-stone-400 mt-0.5">{selectedKH.sdt}</p>
              </div>
              <button
                onClick={() => setSelectedKH(null)}
                className="text-stone-400 hover:text-espresso text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Edit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-stone-100">
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
                  <div className="space-y-3">
                    {modalOrders.map((o) => (
                      <div key={o.id} className="p-4 bg-cream/50 border border-stone-100">
                        {/* Row 1: mã đơn + ngày + trạng thái */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-medium text-rose">{o.id}</span>
                            <span className="text-stone-400 text-xs">{formatDate(o.thoiGian)}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 ${
                            o.trangThai === "Đã giao" ? "bg-green-50 text-green-600" :
                            o.trangThai === "Huỷ" ? "bg-red-50 text-red-500" :
                            o.trangThai === "Đang xử lý" ? "bg-amber-50 text-amber-600" :
                            "bg-stone-50 text-stone-500"
                          }`}>
                            {o.trangThai}
                          </span>
                        </div>

                        {/* Row 2: danh sách sản phẩm */}
                        <div className="space-y-2 mb-3">
                          {o.sanPham.map((sp, i) => (
                            <div key={i} className="flex items-start gap-3 pl-1 border-l-2 border-blush">
                              {/* Ảnh sản phẩm */}
                              <div className="w-12 h-16 shrink-0 bg-white border border-stone-100 rounded overflow-hidden">
                                {sp.anhURL ? (
                                  <img
                                    src={sp.anhURL}
                                    alt={sp.ten}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Thông tin sản phẩm */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="font-medium text-espresso">{sp.ten}</span>
                                  {sp.sizeChon && (
                                    <span className="bg-blush/60 text-espresso px-1.5 py-0.5 text-[10px] leading-none">
                                      {sp.sizeChon}
                                    </span>
                                  )}
                                  <span className="text-stone-400">×{sp.soLuong}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {sp.phanTramGiam && sp.phanTramGiam > 0 && (
                                    <span className="text-xs text-stone-300 line-through">
                                      {formatMoney(sp.giaGoc)}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium text-espresso">
                                    {formatMoney(sp.giaHienThi * sp.soLuong)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Row 3: tổng tiền */}
                        <div className="flex justify-end pt-2 border-t border-stone-100">
                          <span className="text-xs text-stone-400 mr-2">Tổng:</span>
                          <span className="text-sm font-medium text-espresso">{formatMoney(o.tongTien)}</span>
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
