"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { CaiDat } from "@/types";

export default function Footer() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<CaiDat | null>(null);

  useEffect(() => {
    fetch("/api/cai-dat")
      .then((res) => res.json())
      .then((data) => { if (data.success) setSettings(data.data); })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const tenShop = settings?.tenShop || "TRANH ANH STORE";

  return (
    <footer className="bg-espresso text-cream">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* Brand */}
        <div className="text-center mb-12">
          <h3 className="font-heading text-2xl font-light tracking-[0.3em] uppercase text-cream mb-3">
            {tenShop}
          </h3>
          <p className="text-xs text-cream/50 tracking-wider uppercase">
            Thời trang nữ cao cấp
          </p>
        </div>

        <div className="w-full h-px bg-cream/10 mb-12" />

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium text-cream/40 mb-5">
              Về Chúng Tôi
            </h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-xs text-cream/70 hover:text-cream transition-colors uppercase tracking-wider">Về Shop</Link></li>
              <li><Link href="/#san-pham" className="text-xs text-cream/70 hover:text-cream transition-colors uppercase tracking-wider">Bộ Sưu Tập</Link></li>
              <li><Link href="/#san-pham" className="text-xs text-cream/70 hover:text-cream transition-colors uppercase tracking-wider">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium text-cream/40 mb-5">
              Hỗ Trợ
            </h4>
            <ul className="space-y-3">
              <li><span className="text-xs text-cream/70 uppercase tracking-wider">Hướng Dẫn Mua Hàng</span></li>
              <li><span className="text-xs text-cream/70 uppercase tracking-wider">Đổi Trả Hàng</span></li>
              <li><span className="text-xs text-cream/70 uppercase tracking-wider">Ship COD Toàn Quốc</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-medium text-cream/40 mb-5">
              Liên Hệ
            </h4>
            <ul className="space-y-3">
              {settings?.sdt && (
                <li><span className="text-xs text-cream/70 uppercase tracking-wider">{settings.sdt}</span></li>
              )}
              {settings?.email && (
                <li><span className="text-xs text-cream/70 uppercase tracking-wider">{settings.email}</span></li>
              )}
              {settings?.diaChi && (
                <li><span className="text-xs text-cream/70 uppercase tracking-wider">{settings.diaChi}</span></li>
              )}
            </ul>
          </div>
        </div>

        <div className="w-full h-px bg-cream/10 mt-12 mb-8" />

        <p className="text-center text-xs text-cream/30 tracking-wider uppercase">
          © 2026 {tenShop}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
