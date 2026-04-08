"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

function BagIcon({ count }: { count: number }) {
  return (
    <span data-bag-icon className="relative inline-flex items-center">
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Đóng menu khi resize lên desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const isHero = pathname === "/" && !scrolled;
  const navColor = isHero
    ? "text-cream hover:text-cream/70"
    : "text-espresso hover:text-stone";

  const burgerColor = isHero ? "text-cream" : "text-espresso";

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-sm border-b border-blush/60 py-3"
          : "bg-transparent py-4 md:py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative flex items-center justify-between">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-1 transition-colors ${burgerColor}`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Nav trái — desktop only */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 w-1/3">
            <Link href="/" className={`text-xs uppercase tracking-widest font-medium transition-colors ${navColor}`}>
              Trang Chủ
            </Link>
            <Link href="/#san-pham" className={`text-xs uppercase tracking-widest font-medium transition-colors ${navColor}`}>
              Bộ Sưu Tập
            </Link>
          </nav>

          {/* Tên shop — căn giữa tuyệt đối */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 group"
          >
            <span
              className={`font-heading text-lg md:text-xl font-light tracking-[0.2em] md:tracking-[0.25em] uppercase transition-colors duration-300 ${
                isHero ? "text-cream" : "text-espresso"
              }`}
            >
              Tranh Anh
            </span>
            <span
              className={`text-[8px] md:text-[9px] uppercase tracking-[0.35em] md:tracking-[0.45em] transition-colors duration-300 ${
                isHero ? "text-cream/60" : "text-stone-400"
              }`}
            >
              Store
            </span>
          </Link>

          {/* Nav phải — desktop only */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 w-1/3 justify-end">
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

          {/* Giỏ hàng — mobile only */}
          <Link
            href="/gio-hang"
            className={`md:hidden transition-colors ${burgerColor}`}
          >
            <BagIcon count={cartCount} />
          </Link>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-0 z-40 bg-cream/98 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <Link
              href="/"
              className={`font-heading text-2xl font-light tracking-[0.2em] uppercase text-espresso`}
            >
              Tranh Anh
            </Link>
            <div className="flex flex-col items-center gap-6 mt-4">
              <Link
                href="/"
                className="text-sm uppercase tracking-widest font-medium text-espresso hover:text-stone transition-colors"
              >
                Trang Chủ
              </Link>
              <Link
                href="/#san-pham"
                className="text-sm uppercase tracking-widest font-medium text-espresso hover:text-stone transition-colors"
              >
                Bộ Sưu Tập
              </Link>
              <Link
                href="/#san-pham"
                className="text-sm uppercase tracking-widest font-medium text-espresso hover:text-stone transition-colors"
              >
                Sale
              </Link>
              <Link
                href="/gio-hang"
                className="text-sm uppercase tracking-widest font-medium text-espresso hover:text-stone transition-colors flex items-center gap-2"
              >
                <BagIcon count={cartCount} />
                Giỏ Hàng
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
