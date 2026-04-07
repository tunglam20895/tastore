"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CaiDat } from "@/types";

function BagIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex items-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-3 bg-espresso text-cream text-[9px] rounded-full w-4 h-4 flex items-center justify-center leading-none font-medium">
          {count}
        </span>
      )}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<CaiDat | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/cai-dat")
      .then((res) => res.json())
      .then((data) => { if (data.success) setSettings(data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((sum: number, item: { soLuong: number }) => sum + item.soLuong, 0));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  // On home page hero (not yet scrolled), use cream text over the dark hero image
  const isHero = pathname === "/" && !scrolled;
  const navColor = isHero
    ? "text-cream hover:text-cream/70"
    : "text-espresso hover:text-stone";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-sm border-b border-blush/60 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative flex items-center justify-between">
          {/* Left nav */}
          <nav className="flex items-center gap-8">
            <Link href="/" className={`text-xs uppercase tracking-widest font-medium transition-colors ${navColor}`}>
              Trang Chủ
            </Link>
            <Link href="/#san-pham" className={`text-xs uppercase tracking-widest font-medium transition-colors ${navColor}`}>
              Bộ Sưu Tập
            </Link>
          </nav>

          {/* Logo — absolutely centered */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            {settings?.logoURL ? (
              <Image
                src={settings.logoURL}
                alt={settings.tenShop || "TRANH ANH STORE"}
                width={120}
                height={48}
                className="object-contain"
              />
            ) : (
              <span
                className={`font-heading text-lg font-light tracking-[0.3em] uppercase transition-colors duration-300 ${
                  isHero ? "text-cream" : "text-espresso"
                }`}
              >
                {settings?.tenShop || "TRANH ANH STORE"}
              </span>
            )}
          </Link>

          {/* Right nav */}
          <nav className="flex items-center gap-8">
            <Link href="/#san-pham" className={`text-xs uppercase tracking-widest font-medium transition-colors ${navColor}`}>
              Sale
            </Link>
            <Link
              href="/gio-hang"
              className={`text-xs uppercase tracking-widest font-medium transition-colors flex items-center gap-1.5 ${navColor}`}
            >
              <BagIcon count={cartCount} />
              <span className="hidden sm:inline">Giỏ Hàng</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
