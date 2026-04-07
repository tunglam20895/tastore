"use client";

import { useEffect, useState, useCallback } from "react";
import type { MaGiamGia } from "@/types";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CouponForm({
  coupon,
  onSave,
  onCancel,
}: {
  coupon?: MaGiamGia;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!coupon;
  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const [ma, setMa] = useState(coupon?.ma || "");
  const [loai, setLoai] = useState<"phan_tram" | "so_tien">(coupon?.loai || "phan_tram");
  const [giaTri, setGiaTri] = useState(coupon?.giaTri || 0);
  const [giaTriToiDa, setGiaTriToiDa] = useState<number | "">(coupon?.giaTriToiDa ?? "");
  const [donHangToiThieu, setDonHangToiThieu] = useState(coupon?.donHangToiThieu || 0);
  const [soLuong, setSoLuong] = useState(coupon?.soLuong || 50);
  const [ngayHetHan, setNgayHetHan] = useState(
    coupon?.ngayHetHan ? coupon.ngayHetHan.slice(0, 10) : ""
  );
  const [conHieuLuc, setConHieuLuc] = useState(coupon?.conHieuLuc !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full px-3 py-2 border border-stone-200 bg-white text-espresso text-sm focus:outline-none focus:border-espresso transition-colors";
  const labelCls = "block text-xs uppercase tracking-widest text-stone-500 mb-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `/api/ma-giam-gia/${coupon!.id}` : "/api/ma-giam-gia";
      const body = {
        ma,
        loai,
        giaTri,
        giaTriToiDa: giaTriToiDa !== "" ? Number(giaTriToiDa) : null,
        donHangToiThieu,
        soLuong,
        ngayHetHan: ngayHetHan || null,
        conHieuLuc,
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
      setError("Không thể lưu mã giảm giá");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mã code */}
        <div>
          <label className={labelCls}>Mã code *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ma}
              onChange={(e) => setMa(e.target.value.toUpperCase())}
              required
              placeholder="SUMMER20"
              className={inputCls + " uppercase flex-1"}
            />
            <button
              type="button"
              onClick={() => setMa(generateCode())}
              className="px-3 py-2 text-xs border border-stone-200 text-stone-500 hover:bg-blush hover:text-espresso transition-colors whitespace-nowrap"
            >
              Tạo ngẫu nhiên
            </button>
          </div>
        </div>

        {/* Số lượt */}
        <div>
          <label className={labelCls}>Số lượt dùng *</label>
          <input
            type="number"
            value={soLuong}
            onChange={(e) => setSoLuong(Number(e.target.value))}
            required
            min={1}
            className={inputCls}
          />
        </div>
      </div>

      {/* Loại giảm */}
      <div>
        <label className={labelCls}>Loại giảm giá *</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-espresso">
            <input
              type="radio"
              name="loai"
              value="phan_tram"
              checked={loai === "phan_tram"}
              onChange={() => setLoai("phan_tram")}
              className="accent-espresso"
            />
            Phần trăm (%)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-espresso">
            <input
              type="radio"
              name="loai"
              value="so_tien"
              checked={loai === "so_tien"}
              onChange={() => setLoai("so_tien")}
              className="accent-espresso"
            />
            Số tiền cố định (VNĐ)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Giá trị */}
        <div>
          <label className={labelCls}>
            Giá trị * {loai === "phan_tram" ? "(%)" : "(VNĐ)"}
          </label>
          <input
            type="number"
            value={giaTri}
            onChange={(e) => setGiaTri(Number(e.target.value))}
            required
            min={0}
            max={loai === "phan_tram" ? 100 : undefined}
            className={inputCls}
          />
        </div>

        {/* Giảm tối đa (chỉ hiện khi %) */}
        {loai === "phan_tram" && (
          <div>
            <label className={labelCls}>Giảm tối đa (VNĐ)</label>
            <input
              type="number"
              value={giaTriToiDa}
              onChange={(e) => setGiaTriToiDa(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              placeholder="Không giới hạn"
              className={inputCls}
            />
          </div>
        )}

        {/* Đơn tối thiểu */}
        <div>
          <label className={labelCls}>Đơn hàng tối thiểu (VNĐ)</label>
          <input
            type="number"
            value={donHangToiThieu}
            onChange={(e) => setDonHangToiThieu(Number(e.target.value))}
            min={0}
            className={inputCls}
          />
        </div>

        {/* Ngày hết hạn */}
        <div>
          <label className={labelCls}>Ngày hết hạn (để trống = không hết)</label>
          <input
            type="date"
            value={ngayHetHan}
            onChange={(e) => setNgayHetHan(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Trạng thái */}
      <div>
        <label className={labelCls}>Trạng thái</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-espresso">
            <input
              type="radio"
              name="conHieuLuc"
              checked={conHieuLuc}
              onChange={() => setConHieuLuc(true)}
              className="accent-espresso"
            />
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Hiệu lực
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-espresso">
            <input
              type="radio"
              name="conHieuLuc"
              checked={!conHieuLuc}
              onChange={() => setConHieuLuc(false)}
              className="accent-espresso"
            />
            <span className="w-2 h-2 rounded-full bg-stone-300 inline-block" /> Vô hiệu
          </label>
        </div>
      </div>

      {error && <p className="text-rose text-sm">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-stone-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mã"}
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

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<MaGiamGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MaGiamGia | null>(null);
  const [creating, setCreating] = useState(false);
  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const loadCoupons = useCallback(() => {
    setLoading(true);
    fetch("/api/ma-giam-gia", { headers: { "x-admin-password": adminPassword || "" } })
      .then((res) => res.json())
      .then((data) => { if (data.success) setCoupons(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const handleDelete = async (id: string, ma: string) => {
    if (!confirm(`Xóa mã ${ma}?`)) return;
    try {
      const res = await fetch(`/api/ma-giam-gia/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const data = await res.json();
      if (data.success) loadCoupons();
      else alert(data.error);
    } catch {
      alert("Không thể xóa mã");
    }
  };

  const handleToggle = async (coupon: MaGiamGia) => {
    try {
      const res = await fetch(`/api/ma-giam-gia/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ conHieuLuc: !coupon.conHieuLuc }),
      });
      const data = await res.json();
      if (data.success) loadCoupons();
    } catch {}
  };

  if (creating || editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-light text-espresso">
            {editing ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </h1>
          <button
            onClick={() => { setEditing(null); setCreating(false); }}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
          >
            ← Quay lại
          </button>
        </div>
        <div className="bg-white p-8 border border-stone-100">
          <CouponForm
            coupon={editing || undefined}
            onSave={() => { setEditing(null); setCreating(false); loadCoupons(); }}
            onCancel={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-light text-espresso">Mã Giảm Giá</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          + Tạo Mã Mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 text-sm">Đang tải...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">Chưa có mã giảm giá nào</div>
      ) : (
        <div className="bg-white border border-stone-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-widest text-stone-400">
                <th className="text-left py-3 px-4">Mã</th>
                <th className="text-left py-3 px-4">Loại</th>
                <th className="text-left py-3 px-4">Giá trị</th>
                <th className="text-left py-3 px-4">Đơn tối thiểu</th>
                <th className="text-left py-3 px-4">Đã dùng</th>
                <th className="text-left py-3 px-4">Hết hạn</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-right py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = c.ngayHetHan && new Date(c.ngayHetHan) < new Date();
                const isExhausted = c.daDung >= c.soLuong;
                const isActive = c.conHieuLuc && !isExpired && !isExhausted;

                return (
                  <tr key={c.id} className="border-b border-stone-50 hover:bg-cream/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-espresso">{c.ma}</td>
                    <td className="py-3 px-4 text-stone-500 text-xs">
                      {c.loai === "phan_tram" ? "Phần trăm" : "Số tiền"}
                    </td>
                    <td className="py-3 px-4 font-medium text-espresso">
                      {c.loai === "phan_tram"
                        ? `${c.giaTri}%${c.giaTriToiDa ? ` (tối đa ${c.giaTriToiDa.toLocaleString("vi-VN")}đ)` : ""}`
                        : `${c.giaTri.toLocaleString("vi-VN")}đ`
                      }
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-xs">
                      {c.donHangToiThieu > 0 ? `${c.donHangToiThieu.toLocaleString("vi-VN")}đ` : "—"}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-xs">
                      <span className={isExhausted ? "text-red-500" : ""}>
                        {c.daDung}/{c.soLuong}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-400 text-xs">
                      {c.ngayHetHan
                        ? <span className={isExpired ? "text-red-400" : ""}>{new Date(c.ngayHetHan).toLocaleDateString("vi-VN")}</span>
                        : "—"
                      }
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(c)}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400" : "bg-stone-300"}`} />
                        <span className={isActive ? "text-green-600" : "text-stone-400"}>
                          {isActive ? "Hiệu lực" : isExpired ? "Hết hạn" : isExhausted ? "Hết lượt" : "Vô hiệu"}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditing(c)}
                        className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors mr-4"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.ma)}
                        className="text-xs uppercase tracking-widest text-stone-300 hover:text-rose transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
