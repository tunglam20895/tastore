"use client";

import { useEffect, useState, useCallback } from "react";
import LogoUpload from "@/components/admin/LogoUpload";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/contexts/ToastContext";
import type { TrangThaiKH } from "@/types";

export default function AdminSettingsPage() {
  const { settings, refresh } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Trạng thái KH
  const [trangThaiList, setTrangThaiList] = useState<TrangThaiKH[]>([]);
  const [deletingTTId, setDeletingTTId] = useState<string | null>(null);
  const [newTenTT, setNewTenTT] = useState("");
  const [newMauTT, setNewMauTT] = useState("#8C7B72");
  const [addingTT, setAddingTT] = useState(false);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";
  const { showToast } = useToast();

  const loadTrangThai = useCallback(() => {
    fetch("/api/trang-thai-kh")
      .then((r) => r.json())
      .then((d) => { if (d.success) setTrangThaiList(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadTrangThai(); }, [loadTrangThai]);

  const handleAddTrangThai = async () => {
    if (!newTenTT.trim()) return;
    setAddingTT(true);
    try {
      const res = await fetch("/api/trang-thai-kh", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ ten: newTenTT.trim(), mau: newMauTT }),
      });
      const d = await res.json();
      if (d.success) {
        setNewTenTT("");
        setNewMauTT("#8C7B72");
        loadTrangThai();
      } else {
        showToast(d.error || "Thêm thất bại");
      }
    } catch { showToast("Không thể thêm trạng thái"); }
    setAddingTT(false);
  };

  const handleDeleteTrangThai = async (id: string) => {
    if (!confirm("Xóa trạng thái này?")) return;
    setDeletingTTId(id);
    try {
      const res = await fetch(`/api/trang-thai-kh/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const d = await res.json();
      if (d.success) loadTrangThai();
      else showToast(d.error || "Xóa thất bại");
    } catch { showToast("Không thể xóa trạng thái"); }
    setDeletingTTId(null);
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    const adminPassword = localStorage.getItem("admin-password") || "";
    try {
      const res = await fetch("/api/cai-dat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(localSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Refresh settings globally
        await refresh();
      } else {
        showToast(data.error || "Lưu thất bại");
      }
    } catch {
      showToast("Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full max-w-md px-3 py-2 border border-stone-200 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors bg-white";

  return (
    <div>
      <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso mb-6 sm:mb-8">Cài đặt shop</h1>

      {success && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 text-green-700 text-sm border border-green-100">
          Đã lưu cài đặt thành công!
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 lg:p-8 border border-stone-100 space-y-4 sm:space-y-6 lg:space-y-8 max-w-xl">
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-400 mb-3">Logo shop</label>
          <LogoUpload
            currentLogo={localSettings.logoURL}
            onUpload={(url) => setLocalSettings((prev) => ({ ...prev, logoURL: url }))}
          />
        </div>

        {[
          { key: "tenShop", label: "Tên shop", type: "text" },
          { key: "sdt", label: "Số điện thoại", type: "text" },
          { key: "diaChi", label: "Địa chỉ", type: "text" },
          { key: "email", label: "Email", type: "email" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">{label}</label>
            <input
              type={type}
              value={localSettings[key as keyof typeof localSettings]}
              onChange={(e) => setLocalSettings((prev) => ({ ...prev, [key]: e.target.value }))}
              className={inputCls}
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>

      {/* Trạng thái khách hàng */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 border border-stone-100 space-y-4 sm:space-y-6 max-w-xl mt-6 sm:mt-8">
        <h2 className="font-heading text-lg font-light text-espresso">Trạng thái khách hàng</h2>

        <div className="space-y-2">
          {trangThaiList.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-stone-50">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 text-xs font-medium rounded-sm"
                  style={{ backgroundColor: t.mau + "22", color: t.mau }}
                >
                  {t.ten}
                </span>
                <span className="text-xs text-stone-400 font-mono">{t.mau}</span>
              </div>
              <button
                onClick={() => handleDeleteTrangThai(t.id)}
                disabled={deletingTTId === t.id}
                className="text-xs text-stone-300 hover:text-rose transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                {deletingTTId === t.id ? (
                  <span className="inline-block w-3 h-3 border border-rose border-t-transparent rounded-full animate-spin align-middle" />
                ) : "Xóa"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end pt-2">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Tên trạng thái</label>
            <input
              value={newTenTT}
              onChange={(e) => setNewTenTT(e.target.value)}
              placeholder="VD: VIP, Bom hàng..."
              className="w-full px-3 py-2 border border-stone-200 text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Màu</label>
              <input
                type="color"
                value={newMauTT}
                onChange={(e) => setNewMauTT(e.target.value)}
                className="w-10 h-9 border border-stone-200 cursor-pointer bg-white p-0.5"
              />
            </div>
            <button
              onClick={handleAddTrangThai}
              disabled={addingTT || !newTenTT.trim()}
              className="flex-1 sm:flex-none px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addingTT ? (
                <>
                  <span className="inline-block w-3 h-3 border border-cream border-t-transparent rounded-full animate-spin" />
                  Đang thêm...
                </>
              ) : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
