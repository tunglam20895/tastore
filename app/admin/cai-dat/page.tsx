"use client";

import { useEffect, useState } from "react";
import LogoUpload from "@/components/admin/LogoUpload";
import type { CaiDat } from "@/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<CaiDat>({
    logoURL: "", tenShop: "TRANH ANH STORE", sdt: "", diaChi: "", email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState<string>("");

  useEffect(() => {
    const pwd = localStorage.getItem("admin-password") || "";
    setAdminPassword(pwd);

    fetch("/api/cai-dat")
        .then((res) => res.json())
        .then((data) => { if (data.success) setSettings(data.data); })
        .catch(() => {})
        .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/cai-dat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setSettings(data.data);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full max-w-md px-3 py-2 border border-stone-200 text-espresso text-sm focus:outline-none focus:border-espresso transition-colors bg-white";

  if (loading) {
    return (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <div>
        <h1 className="font-heading text-2xl font-light text-espresso mb-8">Cài đặt shop</h1>

        {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm border border-green-100">
              Đã lưu cài đặt thành công!
            </div>
        )}

        <div className="bg-white p-8 border border-stone-100 space-y-8 max-w-xl">
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-3">Logo shop</label>
            <LogoUpload
                currentLogo={settings.logoURL}
                onUpload={(url) => setSettings((prev) => ({ ...prev, logoURL: url }))}
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
                    value={settings[key as keyof CaiDat]}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
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
      </div>
  );
}