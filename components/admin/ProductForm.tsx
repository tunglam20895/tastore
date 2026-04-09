"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";
import type { SanPham, DanhMuc, SizeItem } from "@/types";
import { useToast } from "@/contexts/ToastContext";

const QUICK_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42"];

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
  const { showSuccess, showError } = useToast();

  const [ten, setTen] = useState(product?.ten || "");
  const [giaGoc, setGiaGoc] = useState(product?.giaGoc || 0);
  const [phanTramGiam, setPhanTramGiam] = useState<number | "">(product?.phanTramGiam ?? "");
  // soLuong chỉ dùng khi không có sizes
  const [soLuong, setSoLuong] = useState(product?.soLuong ?? 0);
  // sizes JSONB rows
  const [sizeRows, setSizeRows] = useState<SizeItem[]>(product?.sizes || []);
  const [anhURL, setAnhURL] = useState(product?.anhURL || "");
  const [moTa, setMoTa] = useState(product?.moTa || "");
  const [danhMuc, setDanhMuc] = useState(product?.danhMuc || "");
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasSizes = sizeRows.length > 0;
  const totalSoLuong = hasSizes
    ? sizeRows.reduce((sum, s) => sum + (s.soLuong || 0), 0)
    : soLuong;

  const giaHienThi =
    phanTramGiam !== "" && phanTramGiam > 0
      ? Math.round(giaGoc * (1 - (phanTramGiam as number) / 100))
      : giaGoc;

  useEffect(() => {
    fetch("/api/danh-muc")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  // Thêm size từ quick-pick (nếu chưa có)
  const addQuickSize = (ten: string) => {
    if (!sizeRows.find((r) => r.ten === ten)) {
      setSizeRows([...sizeRows, { ten, soLuong: 0 }]);
    }
  };

  // Thêm row trống
  const addEmptyRow = () => setSizeRows([...sizeRows, { ten: "", soLuong: 0 }]);

  const updateRow = (i: number, field: keyof SizeItem, value: string | number) => {
    setSizeRows(sizeRows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

  const removeRow = (i: number) => setSizeRows(sizeRows.filter((_, idx) => idx !== i));

  const handleGenerateDescription = async () => {
    if (!ten) { showError("Vui lòng nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-mo-ta", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ tenSanPham: ten, danhMuc }),
      });
      const data = await res.json();
      if (data.success) setMoTa(data.data);
      else showError(data.error || "Không thể tạo mô tả");
    } catch {
      showError("Lỗi khi gọi AI");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validate sizes: tên không được trống
    if (hasSizes && sizeRows.some((r) => !r.ten.trim())) {
      setError("Tên size không được để trống");
      setSaving(false);
      return;
    }

    try {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `/api/san-pham/${product!.id}` : "/api/san-pham";
      const body = {
        ten,
        giaGoc,
        phanTramGiam: phanTramGiam !== "" ? Number(phanTramGiam) : null,
        soLuong: totalSoLuong,
        sizes: sizeRows.map((r) => ({ ten: r.ten.trim(), soLuong: r.soLuong })),
        anhURL,
        moTa,
        danhMuc,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword || "",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(isEditing ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
        onSave();
      } else {
        showError(data.error || "Có lỗi xảy ra");
      }
    } catch {
      showError("Không thể lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-stone-200 bg-white text-espresso text-sm focus:outline-none focus:border-espresso transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Tên sản phẩm *
            </label>
            <input
              type="text"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          {/* Giá gốc */}
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

          {/* % Giảm */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              % Giảm giá (0–100)
            </label>
            <input
              type="number"
              value={phanTramGiam}
              onChange={(e) =>
                setPhanTramGiam(e.target.value === "" ? "" : Number(e.target.value))
              }
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
                {phanTramGiam !== "" && (phanTramGiam as number) > 0 && (
                  <span className="text-rose ml-2">(-{phanTramGiam}%)</span>
                )}
              </p>
            )}
          </div>

          {/* Sizes & tồn kho theo size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-stone-500">
                Sizes &amp; Tồn kho theo size
              </label>
              {hasSizes && (
                <span className="text-xs text-stone-400">
                  Tổng:{" "}
                  <span className="font-medium text-espresso">
                    {totalSoLuong}
                  </span>{" "}
                  sản phẩm
                </span>
              )}
            </div>

            {/* Quick-pick */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_SIZES.map((s) => {
                const already = !!sizeRows.find((r) => r.ten === s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addQuickSize(s)}
                    className={`px-2 py-0.5 text-xs border transition-colors ${
                      already
                        ? "border-espresso bg-espresso text-cream cursor-default"
                        : "border-stone-200 text-stone-500 hover:border-espresso hover:text-espresso"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Rows */}
            {hasSizes && (
              <div className="space-y-2 mb-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] uppercase tracking-widest text-stone-400 px-1">
                  <span>Tên size</span>
                  <span>Tồn kho</span>
                  <span />
                </div>
                {sizeRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={row.ten}
                      onChange={(e) =>
                        updateRow(i, "ten", e.target.value.toUpperCase())
                      }
                      placeholder="VD: M"
                      className="px-3 py-1.5 border border-stone-200 bg-white text-espresso text-sm focus:outline-none focus:border-espresso transition-colors uppercase"
                    />
                    <input
                      type="number"
                      value={row.soLuong}
                      onChange={(e) =>
                        updateRow(i, "soLuong", Math.max(0, Number(e.target.value)))
                      }
                      min={0}
                      className="px-3 py-1.5 border border-stone-200 bg-white text-espresso text-sm focus:outline-none focus:border-espresso transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-rose transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addEmptyRow}
              className="text-xs text-stone-400 hover:text-espresso transition-colors border border-dashed border-stone-200 hover:border-espresso px-3 py-1.5 w-full"
            >
              + Thêm size
            </button>
          </div>

          {/* Tồn kho tổng — chỉ hiện khi không có sizes */}
          {!hasSizes && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Số lượng tồn kho *
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
          )}

          {/* Danh mục */}
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
                <option key={cat.id} value={cat.id}>
                  {cat.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ảnh */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
            Ảnh sản phẩm
          </label>
          <ImageUpload onUpload={setAnhURL} currentUrl={anhURL} />
        </div>
      </div>

      {/* Mô tả */}
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
