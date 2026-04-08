"use client";

import { useEffect, useState, useCallback } from "react";
import type { NhanVien } from "@/types";
import { ALL_QUYEN } from "@/types";
import { useToast } from "@/contexts/ToastContext";

const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";
const headers = () => ({ "Content-Type": "application/json", "x-admin-password": adminPassword || "" });

type FormState = {
  ten: string;
  username: string;
  password: string;
  quyen: string[];
  conHoatDong: boolean;
};

const emptyForm = (): FormState => ({
  ten: "", username: "", password: "", quyen: [], conHoatDong: true,
});

export default function AdminNhanVienPage() {
  const [list, setList] = useState<NhanVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NhanVien | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/nhan-vien", { headers: headers() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setList(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (nv: NhanVien) => {
    setForm({ ten: nv.ten, username: nv.username, password: "", quyen: nv.quyen, conHoatDong: nv.conHoatDong });
    setEditing(nv);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!form.ten.trim() || !form.username.trim()) {
      showToast("Vui lòng nhập tên và tên đăng nhập"); return;
    }
    if (creating && form.password.length < 6) {
      showToast("Mật khẩu tối thiểu 6 ký tự"); return;
    }
    if (!creating && form.password && form.password.length < 6) {
      showToast("Mật khẩu mới tối thiểu 6 ký tự"); return;
    }

    setSaving(true);
    try {
      const url = creating ? "/api/nhan-vien" : `/api/nhan-vien/${editing!.id}`;
      const method = creating ? "POST" : "PUT";
      const body: Record<string, unknown> = {
        ten: form.ten.trim(),
        username: form.username.trim(),
        quyen: form.quyen,
        conHoatDong: form.conHoatDong,
      };
      if (creating || form.password) body.password = form.password;

      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
      const d = await res.json();
      if (d.success) {
        setCreating(false); setEditing(null);
        load();
        showToast(creating ? "Tạo nhân viên thành công" : "Cập nhật thành công", "success");
      } else {
        showToast(d.error || "Lưu thất bại");
      }
    } catch { showToast("Không thể lưu"); }
    setSaving(false);
  };

  const handleDelete = async (nv: NhanVien) => {
    if (!confirm(`Xóa nhân viên "${nv.ten}"?`)) return;
    setDeletingId(nv.id);
    try {
      const res = await fetch(`/api/nhan-vien/${nv.id}`, { method: "DELETE", headers: headers() });
      const d = await res.json();
      if (d.success) { load(); showToast("Đã xóa nhân viên", "success"); }
      else showToast(d.error || "Xóa thất bại");
    } catch { showToast("Không thể xóa"); }
    setDeletingId(null);
  };

  const toggleQuyen = (q: string) => {
    setForm((f) => ({
      ...f,
      quyen: f.quyen.includes(q) ? f.quyen.filter((x) => x !== q) : [...f.quyen, q],
    }));
  };

  const isFormOpen = creating || !!editing;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso">Nhân viên</h1>
          <p className="text-xs text-stone-400 mt-1">{list.length} tài khoản</p>
        </div>
        {!isFormOpen && (
          <button onClick={openCreate}
            className="px-5 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 transition-opacity">
            + Thêm nhân viên
          </button>
        )}
      </div>

      {/* Form tạo / chỉnh sửa */}
      {isFormOpen && (
        <div className="bg-white border border-stone-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <h2 className="font-heading text-base sm:text-lg font-light text-espresso mb-4 sm:mb-6">
            {creating ? "Thêm nhân viên mới" : `Chỉnh sửa — ${editing?.ten}`}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="admin-label">Tên hiển thị</label>
              <input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })}
                className="admin-input" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="admin-label">Tên đăng nhập</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="admin-input" placeholder="nhanvien01"
                disabled={!!editing} />
            </div>
            <div>
              <label className="admin-label">
                {creating ? "Mật khẩu" : "Mật khẩu mới (để trống nếu không đổi)"}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="admin-input" placeholder="Tối thiểu 6 ký tự" />
            </div>
            {!!editing && (
              <div className="flex items-center gap-3 pt-6">
                <button type="button"
                  onClick={() => setForm({ ...form, conHoatDong: !form.conHoatDong })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.conHoatDong ? "bg-espresso" : "bg-stone-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.conHoatDong ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-sm text-espresso">
                  {form.conHoatDong ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                </span>
              </div>
            )}
          </div>

          {/* Phân quyền */}
          <div className="mb-6">
            <label className="admin-label mb-3 block">Chức năng được phép truy cập</label>
            <div className="flex flex-wrap gap-2">
              {ALL_QUYEN.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => toggleQuyen(q.key)}
                  className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                    form.quyen.includes(q.key)
                      ? "bg-espresso text-cream border-espresso"
                      : "text-stone-600 border-stone-200 hover:border-espresso hover:text-espresso"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {form.quyen.length === 0 && (
              <p className="text-xs text-rose mt-2">Chưa chọn chức năng nào — nhân viên sẽ không thể truy cập</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity">
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button onClick={() => { setCreating(false); setEditing(null); }}
              className="px-6 py-2 border border-stone-200 text-xs uppercase tracking-widest text-stone-500 hover:text-espresso hover:border-espresso transition-colors">
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 sm:py-16 text-stone-400 text-sm">Chưa có nhân viên nào</div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-widest text-stone-400">
                <th className="text-left py-3 px-4">Tên</th>
                <th className="text-left py-3 px-4">Đăng nhập</th>
                <th className="text-left py-3 px-4">Chức năng</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((nv) => (
                <tr key={nv.id} className="border-b border-stone-50 hover:bg-cream/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-espresso">{nv.ten}</td>
                  <td className="py-3 px-4 font-mono text-xs text-stone-500">{nv.username}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {nv.quyen.length === 0 ? (
                        <span className="text-xs text-stone-300">Không có quyền</span>
                      ) : nv.quyen.map((q) => {
                        const label = ALL_QUYEN.find((x) => x.key === q)?.label || q;
                        return (
                          <span key={q} className="text-[10px] px-2 py-0.5 bg-blush/30 text-espresso">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 ${nv.conHoatDong ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"}`}>
                      {nv.conHoatDong ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(nv)}
                      className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors mr-4">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(nv)}
                      disabled={deletingId === nv.id}
                      className="text-xs uppercase tracking-widest text-stone-300 hover:text-rose transition-colors disabled:opacity-50">
                      {deletingId === nv.id ? (
                        <span className="inline-block w-3 h-3 border border-rose border-t-transparent rounded-full animate-spin align-middle" />
                      ) : "Xóa"}
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
