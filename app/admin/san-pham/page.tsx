"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminChat } from "@/contexts/AdminChatContext";
import type { SanPham, DanhMuc } from "@/types";
import ProductForm from "@/components/admin/ProductForm";
import Pagination from "@/components/admin/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";

const LIMIT_DEFAULT = 20;

function StockBadge({ n }: { n: number }) {
  if (n === 0) return <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500">{n} — Hết</span>;
  if (n <= 30) return <span className="text-xs px-2 py-0.5 bg-rose/10 text-rose">{n} — Sắp hết</span>;
  if (n <= 100) return <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600">{n} — TB</span>;
  return <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600">{n} — Nhiều</span>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [editing, setEditing] = useState<SanPham | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; ten: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(LIMIT_DEFAULT);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [tonKho, setTonKho] = useState("");
  const [conHang, setConHang] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/danh-muc", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch((err) => { if (err.name !== "AbortError") {} });
    return () => controller.abort();
  }, []);

  const loadProducts = useCallback((p: number, s: string, dm: string, tk: string, ch: string, signal?: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (s) params.set("search", s);
    if (dm) params.set("danh_muc", dm);
    if (tk) params.set("ton_kho", tk);
    if (ch) params.set("con_hang", ch);
    fetch(`/api/san-pham?${params}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
          setTotal(data.total ?? data.data.length);
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
        }
      })
      .catch((err) => { if (err.name !== "AbortError") {} })
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(page, search, danhMuc, tonKho, conHang, controller.signal);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, danhMuc, tonKho, conHang, refreshKey, limit]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "danhMuc") { setDanhMuc(value); setPage(1); }
    if (key === "tonKho") { setTonKho(value); setPage(1); }
    if (key === "conHang") { setConHang(value); setPage(1); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/san-pham/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Đã xóa sản phẩm "${confirmDelete.ten}"`);
        setRefreshKey((k) => k + 1);
      } else {
        showError(data.error || "Không thể xóa sản phẩm");
      }
    } catch {
      showError("Không thể xóa sản phẩm");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleSave = () => {
    setEditing(null);
    setCreating(false);
    setRefreshKey((k) => k + 1);
  };

  // ─── Push data to AdminChat context ────────────────────────────────────────
  const { setScreenData } = useAdminChat();

  useEffect(() => {
    if (products.length > 0 && !loading && !creating && !editing) {
      const filters: string[] = [];
      if (search) filters.push(`Tìm kiếm: "${search}"`);
      if (danhMuc) {
        const dm = categories.find(c => c.id === danhMuc);
        filters.push(`Danh mục: ${dm?.tenDanhMuc || danhMuc}`);
      }
      if (tonKho) {
        const map: Record<string, string> = { it: 'Sắp hết (5-30)', trung_binh: 'Trung bình (30-100)', nhieu: 'Còn nhiều (>100)' };
        filters.push(`Tồn kho: ${map[tonKho] || tonKho}`);
      }
      if (conHang) filters.push(conHang === 'true' ? 'Còn hàng' : 'Hết hàng');

      const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

      setScreenData({
        page: 'san-pham',
        title: 'Quản lý sản phẩm',
        summary: `Đang hiển thị ${products.length} sản phẩm (trang ${page}/${totalPages}). Tổng ${total} sản phẩm.`,
        filters,
        stats: { 'Tổng sản phẩm': total, 'Đang hiển thị': products.length },
        items: products.map(p =>
          `${p.ten} | Giá: ${fmtNum(p.giaHienThi)}đ${p.phanTramGiam ? ` (GIẢM ${p.phanTramGiam}%)` : ''} | Tồn: ${p.soLuong}${p.sizes?.length ? ` | Sizes: ${p.sizes.map(s => `${s.ten}(${s.soLuong})`).join(', ')}` : ''}`
        ),
      });
    } else if (!loading && !creating && !editing && products.length === 0) {
      setScreenData({
        page: 'san-pham',
        title: 'Quản lý sản phẩm',
        summary: 'Chưa có sản phẩm nào.',
        items: [],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, danhMuc, tonKho, conHang, page, totalPages, total, loading, creating, editing, categories]);

  if (creating || editing) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso">
            {editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          <button
            onClick={() => { setEditing(null); setCreating(false); }}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
          >
            ← Quay lại
          </button>
        </div>
        <div className="bg-white p-4 sm:p-6 lg:p-8 border border-stone-300 rounded-xl shadow-md">
          <ProductForm
            product={editing || undefined}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-light text-espresso">Quản lý sản phẩm</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm tên sản phẩm..."
            className="px-3 py-1.5 border border-stone-300 text-sm text-espresso focus:outline-none focus:border-espresso bg-white rounded w-full sm:w-48"
          />
          <button type="submit" className="px-4 py-1.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80">
            Tìm
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-3 py-1.5 border border-stone-300 text-xs text-stone-500 hover:text-espresso rounded">×</button>
          )}
        </form>

        <select value={danhMuc} onChange={(e) => handleFilterChange("danhMuc", e.target.value)}
          className="px-3 py-1.5 border border-stone-300 text-sm text-espresso focus:outline-none focus:border-espresso bg-white rounded">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.tenDanhMuc}</option>)}
        </select>

        <select value={tonKho} onChange={(e) => handleFilterChange("tonKho", e.target.value)}
          className="px-3 py-1.5 border border-stone-300 text-sm text-espresso focus:outline-none focus:border-espresso bg-white rounded">
          <option value="">Tất cả tồn kho</option>
          <option value="it">🔴 Sắp hết (5–30)</option>
          <option value="trung_binh">🟡 Trung bình (30–100)</option>
          <option value="nhieu">🟢 Còn nhiều (&gt;100)</option>
        </select>

        <select value={conHang} onChange={(e) => handleFilterChange("conHang", e.target.value)}
          className="px-3 py-1.5 border border-stone-300 text-sm text-espresso focus:outline-none focus:border-espresso bg-white rounded">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Còn hàng</option>
          <option value="false">Hết hàng</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" label="Đang tải..." />
        </div>
      ) : (
        <div className="bg-white border border-stone-300 rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/50 text-xs uppercase tracking-widest text-stone-600 font-medium">
                <th className="text-left py-3 px-4">Ảnh</th>
                <th className="text-left py-3 px-4">Tên</th>
                <th className="text-left py-3 px-4">Giá bán</th>
                <th className="text-left py-3 px-4">Tồn kho</th>
                <th className="text-left py-3 px-4">Sizes</th>
                <th className="text-right py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-stone-400">Chưa có sản phẩm nào</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-b border-stone-200 hover:bg-stone-100/40 transition-colors">
                  <td className="py-3 px-4">
                    {p.anhURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.anhURL} alt="" className="w-12 h-16 object-cover" />
                    ) : (
                      <div className="w-12 h-16 bg-blush flex items-center justify-center text-[10px] text-stone-400">Ảnh</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-espresso">{p.ten}</p>
                    {p.phanTramGiam ? (
                      <span className="text-xs text-rose">-{p.phanTramGiam}%</span>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 font-medium text-espresso">
                    {p.giaHienThi.toLocaleString("vi-VN")}đ
                    {p.phanTramGiam ? (
                      <span className="block text-xs text-stone-400 line-through">{p.giaGoc.toLocaleString("vi-VN")}đ</span>
                    ) : null}
                  </td>
                  <td className="py-3 px-4"><StockBadge n={p.soLuong} /></td>
                  <td className="py-3 px-4">
                    {p.sizes && p.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span
                            key={s.ten}
                            className={`text-[10px] px-1.5 py-0.5 border ${
                              s.soLuong === 0
                                ? "border-stone-100 text-stone-300 line-through"
                                : s.soLuong <= 5
                                ? "border-rose/30 text-rose bg-rose/5"
                                : "border-stone-200 text-stone-500"
                            }`}
                          >
                            {s.ten}
                            <span className="ml-0.5 opacity-60">({s.soLuong})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-stone-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setEditing(p)} className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors mr-4">
                      Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: p.id, ten: p.ten })}
                      disabled={deletingId === p.id}
                      className="text-xs uppercase tracking-widest text-stone-300 hover:text-rose transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? (
                        <span className="inline-block w-3 h-3 border border-rose border-t-transparent rounded-full animate-spin align-middle" />
                      ) : "Xóa"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={(p) => setPage(p)} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa sản phẩm?"
        message={`Bạn có chắc chắn muốn xóa "${confirmDelete?.ten}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        isDanger
      />
    </div>
  );
}
