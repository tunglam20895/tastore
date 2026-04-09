"use client";

import { useState } from "react";
import type { CartItem } from "@/types";

function FloatingInput({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative pt-5">
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="w-full bg-transparent border-0 border-b border-stone-300 py-2 px-0 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors peer"
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-5 text-stone-400 text-sm transition-all duration-200 pointer-events-none
          peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400
          peer-focus:top-0 peer-focus:text-xs peer-focus:text-espresso
          peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-espresso"
      >
        {label}{required && " *"}
      </label>
    </div>
  );
}

function FloatingTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative pt-5">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder=" "
        className="w-full bg-transparent border-0 border-b border-stone-300 py-2 px-0 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors resize-none peer"
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-5 text-stone-400 text-sm transition-all duration-200 pointer-events-none
          peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone-400
          peer-focus:top-0 peer-focus:text-xs peer-focus:text-espresso
          peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-espresso"
      >
        {label}
      </label>
    </div>
  );
}

export default function OrderForm({
  cart,
  total,
  onClearCart,
  maGiamGia,
  giaTriGiam,
}: {
  cart: CartItem[];
  total: number;
  onClearCart: () => void;
  maGiamGia?: string;
  giaTriGiam?: number;
}) {
  const [formData, setFormData] = useState({ tenKH: "", sdt: "", diaChi: "", ghiChu: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const tongTienSauGiam = total - (giaTriGiam ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/don-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenKH: formData.tenKH,
          sdt: formData.sdt,
          diaChi: formData.diaChi,
          sanPham: cart,
          tongTien: total,
          maGiamGia: maGiamGia || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onClearCart();
      } else {
        setError(data.error || "Có lỗi xảy ra");
      }
    } catch {
      setError("Không thể gửi đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16">
        <p className="text-xs uppercase tracking-widest text-rose mb-4">Thành công</p>
        <h2 className="font-heading text-3xl font-light text-espresso mb-3">
          Đặt hàng thành công!
        </h2>
        <p className="text-sm text-stone-500">
          Cảm ơn quý khách. Chúng tôi sẽ liên hệ sớm để xác nhận đơn hàng.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FloatingInput
        id="tenKH"
        label="Họ và tên"
        required
        value={formData.tenKH}
        onChange={(v) => setFormData({ ...formData, tenKH: v })}
      />
      <FloatingInput
        id="sdt"
        label="Số điện thoại"
        type="tel"
        required
        value={formData.sdt}
        onChange={(v) => setFormData({ ...formData, sdt: v })}
      />
      <FloatingTextarea
        id="diaChi"
        label="Địa chỉ giao hàng *"
        value={formData.diaChi}
        onChange={(v) => setFormData({ ...formData, diaChi: v })}
      />
      <FloatingTextarea
        id="ghiChu"
        label="Ghi chú (tùy chọn)"
        value={formData.ghiChu}
        onChange={(v) => setFormData({ ...formData, ghiChu: v })}
      />

      {error && <p className="text-rose text-sm">{error}</p>}

      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-cream/60 border-t-cream rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : `Xác Nhận Đặt Hàng — ${tongTienSauGiam.toLocaleString("vi-VN")}đ`}
        </button>
      </div>
    </form>
  );
}
