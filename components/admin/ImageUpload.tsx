"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";

export default function ImageUpload({
  onUpload,
  currentUrl,
}: {
  onUpload: (url: string) => void;
  currentUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "san-pham-images");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": adminPassword || "" },
        body: formData,
      });

      const data = await res.json();
      if (data.success) onUpload(data.data.url);
      else showToast(data.error || "Upload thất bại");
    } catch {
      showToast("Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {preview && (
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-blush border border-stone-200">
          <Image src={preview} alt="Preview" fill className="object-cover" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 border border-stone-200 text-espresso text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50"
      >
        {uploading ? "Đang upload..." : preview ? "Thay ảnh" : "Chọn ảnh"}
      </button>
    </div>
  );
}
