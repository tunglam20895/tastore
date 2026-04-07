"use client";

import { useEffect, useState, useCallback } from "react";
import type { SanPham } from "@/types";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [editing, setEditing] = useState<SanPham | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const loadProducts = useCallback(() => {
    fetch("/api/san-pham")
      .then((res) => res.json())
      .then((data) => { if (data.success) setProducts(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const res = await fetch(`/api/san-pham/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const data = await res.json();
      if (data.success) loadProducts();
      else alert(data.error || "Không thể xóa sản phẩm");
    } catch {
      alert("Không thể xóa sản phẩm");
    }
  };

  const handleSave = () => {
    setEditing(null);
    setCreating(false);
    loadProducts();
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
        <div className="bg-white p-8 border border-stone-100">
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-light text-espresso">Quản lý sản phẩm</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 text-sm">Đang tải...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">Chưa có sản phẩm nào</div>
      ) : (
        <div className="bg-white border border-stone-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-widest text-stone-400">
                <th className="text-left py-3 px-4">Ảnh</th>
                <th className="text-left py-3 px-4">Tên</th>
                <th className="text-left py-3 px-4">Giá gốc</th>
                <th className="text-left py-3 px-4">Giảm</th>
                <th className="text-left py-3 px-4">Giá bán</th>
                <th className="text-left py-3 px-4">Tồn kho</th>
                <th className="text-right py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-50 hover:bg-cream/50 transition-colors">
                  <td className="py-3 px-4">
                    {p.anhURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.anhURL} alt="" className="w-12 h-16 object-cover" />
                    ) : (
                      <div className="w-12 h-16 bg-blush flex items-center justify-center text-[10px] text-stone-400">
                        Ảnh
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-espresso">{p.ten}</td>
                  <td className="py-3 px-4 text-stone-500">
                    {p.giaGoc.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="py-3 px-4">
                    {p.phanTramGiam ? (
                      <span className="text-rose text-xs font-medium">-{p.phanTramGiam}%</span>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-espresso">
                    {p.giaHienThi.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="py-3 px-4">
                    {p.soLuong === 0 ? (
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-500">{p.soLuong} — Hết</span>
                    ) : p.soLuong <= 10 ? (
                      <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600">{p.soLuong} — Sắp hết</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-600">{p.soLuong}</span>
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
        </div>
      )}
    </div>
  );
}
