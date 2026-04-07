"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function LogoUpload({
  currentLogo,
  onUpload,
}: {
  currentLogo?: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (data.success) onUpload(data.data.url);
      else alert(data.error || "Upload thất bại");
    } catch {
      alert("Không thể upload logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="w-48 h-20 border border-stone-200 overflow-hidden bg-white flex items-center justify-center">
        {currentLogo ? (
          <Image src={currentLogo} alt="Logo shop" width={192} height={80} className="object-contain" />
        ) : (
          <span className="text-xs text-stone-400 uppercase tracking-widest">Chưa có logo</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 border border-stone-200 text-espresso text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50"
      >
        {uploading ? "Đang upload..." : "Upload logo mới"}
      </button>
    </div>
  );
}
