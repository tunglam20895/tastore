"use client";

import { useEffect, useState, useCallback } from "react";
import type { SanPham, DanhMuc } from "@/types";
import ProductForm from "@/components/admin/ProductForm";
import Pagination from "@/components/admin/Pagination";

const LIMIT = 20;

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [tonKho, setTonKho] = useState("");
  const [conHang, setConHang] = useState("");

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  useEffect(() => {
    fetch("/api/danh-muc").then((r) => r.json()).then((d) => { if (d.success) setCategories(d.data); }).catch(() => {});
  }, []);

  const loadProducts = useCallback((p = 1, s = search, dm = danhMuc, tk = tonKho, ch = conHang) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (s) params.set("search", s);
    if (dm) params.set("danh_muc", dm);
    if (tk) params.set("ton_kho", tk);
    if (ch) params.set("con_hang", ch);
    fetch(`/api/san-pham?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
          setTotal(data.total ?? data.data.length);
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, danhMuc, tonKho, conHang]);

  useEffect(() => { loadProducts(1); }, [loadProducts]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "danhMuc") { setDanhMuc(value); loadProducts(1, search, value, tonKho, conHang); }
    if (key === "tonKho") { setTonKho(value); loadProducts(1, search, danhMuc, value, conHang); }
    if (key === "conHang") { setConHang(value); loadProducts(1, search, danhMuc, tonKho, value); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    loadProducts(1, searchInput, danhMuc, tonKho, conHang);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const res = await fetch(`/api/san-pham/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const data = await res.json();
      if (data.success) loadProducts(page);
      else alert(data.error || "Không thể xóa sản phẩm");
    } catch {
      alert("Không thể xóa sản phẩm");
    }
  };

  const handleSave = () => {
    setEditing(null);
    setCreating(false);
    loadProducts(page);
  };

  if (creating || editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-light text-espresso">
            {editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
          <button
            onClick={() => { setEditing(null); setCreating(false); }}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
          >
            ← Quay lại
          </button>
        </div>
        <div className="bg-white p-8 border border-stone-300 rounded-xl shadow-md">
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
      <div className="flex items-center justify-between mb-6">
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
            className="px-3 py-1.5 border border-stone-300 text-sm text-espresso focus:outline-none focus:border-espresso bg-white rounded w-48"
          />
          <button type="submit" className="px-4 py-1.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80">
            Tìm
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); loadProducts(1, "", danhMuc, tonKho, conHang); }}
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
        <div className="text-center py-16 text-stone-400 text-sm">Đang tải...</div>
      ) : (
        <div className="bg-white border border-stone-300 rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
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
                    <button onClick={() => handleDelete(p.id)} className="text-xs uppercase tracking-widest text-stone-300 hover:text-rose transition-colors">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={(p) => loadProducts(p)} />
          </div>
        </div>
      )}
    </div>
  );
}
