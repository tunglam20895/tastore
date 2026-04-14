"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

export default function Footer() {
  const { settings } = useSettings();
  const tenShop = settings?.tenShop || "TRANG ANH STORE";

  return (
    <footer className="bg-espresso text-cream">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-8 md:pb-10">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="font-heading text-xl md:text-2xl font-light tracking-[0.3em] uppercase text-cream mb-3">
            {tenShop}
          </h3>
          <p className="text-xs text-cream/50 tracking-wider uppercase">
            Thời trang nữ cao cấp
          </p>
        </div>

        <div className="w-full h-px bg-cream/10 mb-8 md:mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 text-center md:text-left">
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
              <li><Link href="/tra-cuu-don-hang" className="text-xs text-cream/70 hover:text-cream transition-colors uppercase tracking-wider">Tra Cứu Đơn Hàng</Link></li>
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

        <div className="w-full h-px bg-cream/10 mt-8 md:mt-12 mb-6 md:mb-8" />

        <p className="text-center text-xs text-cream/30 tracking-wider uppercase">
          © 2026 {tenShop}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
