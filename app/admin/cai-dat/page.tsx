"use client";

import { useEffect, useState, useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTrangThaiDH, type TrangThaiDH } from "@/contexts/TrangThaiDHContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { TrangThaiKH } from "@/types";

export default function AdminSettingsPage() {
  const { settings, refresh } = useSettings();
  const { trangThais: trangThaiDHList, refresh: refreshTrangThaiDH } = useTrangThaiDH();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";
  const { showToast, showSuccess, showError } = useToast();
  const [confirmDeleteDH, setConfirmDeleteDH] = useState<{ key: string; ten: string } | null>(null);
  const [confirmDeleteKH, setConfirmDeleteKH] = useState<{ id: string; ten: string } | null>(null);

  // ── Logo upload ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "shop-assets");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": adminPassword || "" },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLocalSettings((prev) => ({ ...prev, logoURL: data.data.url }));
      } else {
        showToast(data.error || "Upload thất bại");
      }
    } catch {
      showToast("Không thể upload logo");
    }
    setUploading(false);
  };

  // ── Trạng thái đơn hàng ──
  const [updatingColor, setUpdatingColor] = useState<string | null>(null);
  const [deletingStatusKey, setDeletingStatusKey] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#8C7B72");
  const [addingStatus, setAddingStatus] = useState(false);

  const handleUpdateColor = async (tt: TrangThaiDH, mau: string) => {
    setUpdatingColor(tt.key);
    try {
      const res = await fetch("/api/trang-thai-dh", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ key: tt.key, mau }),
      });
      const d = await res.json();
      if (d.success) {
        refreshTrangThaiDH();
        showToast(`Đã cập nhật màu "${tt.ten}"`, "success");
      } else {
        showToast(d.error || "Cập nhật thất bại");
      }
    } catch {
      showToast("Không thể cập nhật màu");
    }
    setUpdatingColor(null);
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    setAddingStatus(true);
    try {
      const res = await fetch("/api/trang-thai-dh", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ ten: newStatusName.trim(), mau: newStatusColor }),
      });
      const d = await res.json();
      if (d.success) {
        setNewStatusName("");
        setNewStatusColor("#8C7B72");
        refreshTrangThaiDH();
        showToast(`Đã thêm trạng thái "${newStatusName.trim()}"`, "success");
      } else {
        showToast(d.error || "Thêm thất bại");
      }
    } catch {
      showToast("Không thể thêm trạng thái");
    }
    setAddingStatus(false);
  };

  const handleDeleteStatus = async () => {
    if (!confirmDeleteDH) return;
    setDeletingStatusKey(confirmDeleteDH.key);
    try {
      const res = await fetch(`/api/trang-thai-dh?key=${encodeURIComponent(confirmDeleteDH.key)}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const d = await res.json();
      if (d.success) {
        refreshTrangThaiDH();
        showSuccess(`Đã xóa trạng thái "${confirmDeleteDH.ten}"`);
      } else {
        showError(d.error || "Xóa thất bại");
      }
    } catch {
      showError("Không thể xóa trạng thái");
    }
    setDeletingStatusKey(null);
    setConfirmDeleteDH(null);
  };

  // ── Trạng thái khách hàng ──
  const [trangThaiList, setTrangThaiList] = useState<TrangThaiKH[]>([]);
  const [deletingTTId, setDeletingTTId] = useState<string | null>(null);
  const [newTenTT, setNewTenTT] = useState("");
  const [newMauTT, setNewMauTT] = useState("#8C7B72");
  const [addingTT, setAddingTT] = useState(false);

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
    } catch {
      showToast("Không thể thêm trạng thái");
    }
    setAddingTT(false);
  };

  const handleDeleteTrangThai = async () => {
    if (!confirmDeleteKH) return;
    setDeletingTTId(confirmDeleteKH.id);
    try {
      const res = await fetch(`/api/trang-thai-kh/${confirmDeleteKH.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword || "" },
      });
      const d = await res.json();
      if (d.success) {
        loadTrangThai();
        showSuccess(`Đã xóa trạng thái "${confirmDeleteKH.ten}"`);
      }
      else showError(d.error || "Xóa thất bại");
    } catch {
      showError("Không thể xóa trạng thái");
    }
    setDeletingTTId(null);
    setConfirmDeleteKH(null);
  };

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    const adminPw = localStorage.getItem("admin-password") || "";
    try {
      const res = await fetch("/api/cai-dat", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
        body: JSON.stringify(localSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
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

  const inputCls = "w-full px-3 py-2 border border-stone-200 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors bg-white rounded-lg";

  return (
    <div>
      <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso mb-6">Cài đặt shop</h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm border border-green-100 rounded-xl">
          ✓ Đã lưu cài đặt thành công!
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ═══════════════════════════════════════════════
            TRÁI: THÔNG TIN SHOP
            ═══════════════════════════════════════════════ */}
        <div className="w-full lg:w-[380px] shrink-0 bg-white border border-stone-200 rounded-xl p-6">
          <div className="mb-5 pb-4 border-b border-stone-100">
            <h2 className="font-heading text-base font-light text-espresso">Thông tin shop</h2>
            <p className="text-xs text-stone-400 mt-0.5">Cập nhật thông tin hiển thị trên website</p>
          </div>

          {/* Logo — preview box full-width → upload button below */}
          <div className="mb-5">
            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2">Logo</label>
            <div className="w-full aspect-[3/2] bg-stone-50 border border-stone-200 rounded-lg overflow-hidden flex items-center justify-center mb-3">
              {localSettings.logoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localSettings.logoURL} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-stone-300">Chưa có logo</span>
              )}
            </div>
            {/* Upload button — border text style */}
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-500 text-xs uppercase tracking-widest hover:border-espresso hover:text-espresso transition-colors cursor-pointer rounded-lg">
              {uploading ? "Đang upload..." : "Upload logo mới"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          {/* Form fields */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Tên shop</label>
              <input type="text" value={localSettings.tenShop} onChange={(e) => setLocalSettings((p) => ({ ...p, tenShop: e.target.value }))} className={inputCls} placeholder="TRANG ANH STORE" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Email</label>
              <input type="email" value={localSettings.email} onChange={(e) => setLocalSettings((p) => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="tranganhstore@gmail.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Số điện thoại</label>
                <input type="text" value={localSettings.sdt} onChange={(e) => setLocalSettings((p) => ({ ...p, sdt: e.target.value }))} className={inputCls} placeholder="0967290792" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Địa chỉ</label>
                <input type="text" value={localSettings.diaChi} onChange={(e) => setLocalSettings((p) => ({ ...p, diaChi: e.target.value }))} className={inputCls} placeholder="Hà Nội" />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-2.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 rounded-lg font-medium"
          >
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════
            PHẢI: TRẠNG THÁI
            ═══════════════════════════════════════════════ */}
        <div className="flex-1 w-full min-w-0 space-y-6">

          {/* ── Trạng thái đơn hàng ── */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-stone-100">
              <div>
                <h2 className="font-heading text-base font-light text-espresso">Trạng thái đơn hàng</h2>
                <p className="text-xs text-stone-400 mt-0.5">Quản lý màu sắc, tên và thêm/xóa trạng thái</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full">
                {trangThaiDHList.length} trạng thái
              </span>
            </div>

            {/* Grid 3 cột: status cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {trangThaiDHList.map((tt) => (
                <div
                  key={tt.key}
                  className="border border-stone-200 rounded-lg overflow-hidden"
                  style={{ backgroundColor: tt.mau + "08" }}
                >
                  {/* Colored header: tên + edit/delete icons */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                    <span className="text-[11px] font-medium truncate" style={{ color: tt.mau }}>
                      {tt.ten}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button className="p-1 text-stone-300 hover:text-espresso transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDH({ key: tt.key, ten: tt.ten })}
                        disabled={deletingStatusKey === tt.key}
                        className="p-1 text-stone-300 hover:text-rose transition-colors disabled:opacity-30"
                      >
                        {deletingStatusKey === tt.key ? (
                          <span className="inline-block w-3 h-3 border border-rose border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Color row: "MÀU" + circle + hex input */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400">Màu</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: tt.mau }} />
                      <input
                        type="color"
                        value={tt.mau}
                        onChange={(e) => handleUpdateColor(tt, e.target.value)}
                        disabled={updatingColor === tt.key}
                        className="w-7 h-6 border border-stone-200 cursor-pointer bg-white p-0.5 rounded disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new — dashed border */}
              <div className="border-2 border-dashed border-stone-200 rounded-lg p-2.5 flex flex-col justify-center gap-1.5">
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
                  placeholder="Tên trạng thái mới..."
                  className="w-full text-[10px] px-2 py-1.5 border border-stone-200 rounded focus:outline-none focus:border-espresso bg-white text-center"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-6 h-5 border border-stone-200 cursor-pointer bg-white p-0 rounded"
                  />
                  <button
                    onClick={handleAddStatus}
                    disabled={addingStatus || !newStatusName.trim()}
                    className="ml-auto text-[9px] uppercase tracking-widest text-stone-400 hover:text-espresso disabled:opacity-40 transition-colors flex items-center gap-1"
                  >
                    {addingStatus ? (
                      <span className="inline-block w-2.5 h-2.5 border border-stone-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>+ Thêm</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Trạng thái khách hàng ── */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-stone-100">
              <div>
                <h2 className="font-heading text-base font-light text-espresso">Trạng thái khách hàng</h2>
                <p className="text-xs text-stone-400 mt-0.5">Phân loại khách hàng theo mức độ thân thiết</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-full">
                {trangThaiList.length} trạng thái
              </span>
            </div>

            {/* Pills with round ✕ button */}
            <div className="flex flex-wrap gap-2 mb-5">
              {trangThaiList.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-0 pl-3 pr-1.5 py-1.5 text-xs font-medium rounded-full border transition-colors"
                  style={{
                    backgroundColor: t.mau + "08",
                    color: t.mau,
                    borderColor: t.mau + "20",
                  }}
                >
                  {t.ten}
                  <button
                    onClick={() => setConfirmDeleteKH({ id: t.id, ten: t.ten })}
                    disabled={deletingTTId === t.id}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors disabled:opacity-30"
                  >
                    {deletingTTId === t.id ? (
                      <span className="inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="opacity-40 hover:opacity-100 text-[10px] leading-none">✕</span>
                    )}
                  </button>
                </span>
              ))}
              {trangThaiList.length === 0 && (
                <span className="text-xs text-stone-300 py-1">Chưa có trạng thái nào</span>
              )}
            </div>

            {/* Add form */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Tên trạng thái mới</label>
                <input
                  value={newTenTT}
                  onChange={(e) => setNewTenTT(e.target.value)}
                  placeholder="VD: VIP, Tiềm năng, Mới..."
                  className={inputCls}
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Màu</label>
                <input
                  type="color"
                  value={newMauTT}
                  onChange={(e) => setNewMauTT(e.target.value)}
                  className="w-full sm:w-10 h-10 border border-stone-200 cursor-pointer bg-white p-0.5 rounded-lg"
                />
              </div>
              <button
                onClick={handleAddTrangThai}
                disabled={addingTT || !newTenTT.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 rounded-lg font-medium"
              >
                {addingTT ? "..." : "Thêm"}
              </button>
            </div>
          </div>

        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteDH}
        onClose={() => setConfirmDeleteDH(null)}
        onConfirm={handleDeleteStatus}
        title="Xóa trạng thái đơn hàng?"
        message={`Bạn có chắc chắn muốn xóa trạng thái "${confirmDeleteDH?.ten}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        isDanger
      />
      <ConfirmDialog
        isOpen={!!confirmDeleteKH}
        onClose={() => setConfirmDeleteKH(null)}
        onConfirm={handleDeleteTrangThai}
        title="Xóa trạng thái khách hàng?"
        message={`Bạn có chắc chắn muốn xóa trạng thái "${confirmDeleteKH?.ten}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        isDanger
      />
    </div>
  );
}
