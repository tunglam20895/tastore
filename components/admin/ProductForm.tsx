"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";
import type { SanPham, DanhMuc } from "@/types";

function StockBadge({ soLuong }: { soLuong: number }) {
  if (soLuong === 0) return <span className="ml-2 text-xs px-2 py-0.5 bg-red-50 text-red-500">Hết hàng</span>;
  if (soLuong <= 10) return <span className="ml-2 text-xs px-2 py-0.5 bg-amber-50 text-amber-600">Sắp hết</span>;
  return <span className="ml-2 text-xs px-2 py-0.5 bg-green-50 text-green-600">Còn hàng</span>;
}

export default function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product?: SanPham;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!product;
  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const [ten, setTen] = useState(product?.ten || "");
  const [giaGoc, setGiaGoc] = useState(product?.giaGoc || 0);
  const [phanTramGiam, setPhanTramGiam] = useState<number | "">(product?.phanTramGiam ?? "");
  const [soLuong, setSoLuong] = useState(product?.soLuong ?? 0);
  const [anhURL, setAnhURL] = useState(product?.anhURL || "");
  const [moTa, setMoTa] = useState(product?.moTa || "");
  const [danhMuc, setDanhMuc] = useState(product?.danhMuc || "");
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const giaHienThi = phanTramGiam !== "" && phanTramGiam > 0
    ? Math.round(giaGoc * (1 - phanTramGiam / 100))
    : giaGoc;

  useEffect(() => {
    fetch("/api/danh-muc")
      .then((res) => res.json())
      .then((data) => { if (data.success) setCategories(data.data); })
      .catch(() => {});
  }, []);

  const handleGenerateDescription = async () => {
    if (!ten) { alert("Vui lòng nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-mo-ta", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ tenSanPham: ten, danhMuc }),
      });
      const data = await res.json();
      if (data.success) setMoTa(data.data);
      else alert(data.error || "Không thể tạo mô tả");
    } catch {
      alert("Lỗi khi gọi AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `/api/san-pham/${product!.id}` : "/api/san-pham";
      const body = {
        ten,
        giaGoc,
        phanTramGiam: phanTramGiam !== "" ? Number(phanTramGiam) : null,
        soLuong,
        anhURL,
        moTa,
        danhMuc,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) onSave();
      else setError(data.error || "Có lỗi xảy ra");
    } catch {
      setError("Không thể lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-stone-200 bg-white text-espresso text-sm focus:outline-none focus:border-espresso transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Tên sản phẩm *
            </label>
            <input type="text" value={ten} onChange={(e) => setTen(e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Giá gốc (VNĐ) *
            </label>
            <input
              type="number"
              value={giaGoc}
              onChange={(e) => setGiaGoc(Number(e.target.value))}
              required
              min={0}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              % Giảm giá (0–100)
            </label>
            <input
              type="number"
              value={phanTramGiam}
              onChange={(e) => setPhanTramGiam(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              max={100}
              placeholder="Để trống nếu không giảm"
              className={inputCls}
            />
            {giaGoc > 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Giá bán:{" "}
                <span className="font-medium text-espresso">
                  {giaHienThi.toLocaleString("vi-VN")}đ
                </span>
                {phanTramGiam !== "" && phanTramGiam > 0 && (
                  <span className="text-rose ml-2">(-{phanTramGiam}%)</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Số lượng tồn kho *
              <StockBadge soLuong={soLuong} />
            </label>
            <input
              type="number"
              value={soLuong}
              onChange={(e) => setSoLuong(Math.max(0, Number(e.target.value)))}
              required
              min={0}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Danh mục
            </label>
            <select
              value={danhMuc}
              onChange={(e) => setDanhMuc(e.target.value)}
              className={inputCls}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.tenDanhMuc}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
            Ảnh sản phẩm
          </label>
          <ImageUpload onUpload={setAnhURL} currentUrl={anhURL} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-widest text-stone-500">Mô tả</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generating}
            className="text-xs bg-cream text-espresso border border-espresso/20 px-3 py-1 hover:bg-blush transition-colors disabled:opacity-50"
          >
            {generating ? "Đang tạo..." : "✨ Tạo mô tả AI"}
          </button>
        </div>
        <textarea
          value={moTa}
          onChange={(e) => setMoTa(e.target.value)}
          rows={5}
          className={inputCls}
        />
      </div>

      {error && <p className="text-rose text-sm">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm sản phẩm"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-stone-200 text-espresso text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
