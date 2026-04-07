"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    if (typeof window !== "undefined") localStorage.removeItem("admin-password");
    window.location.href = "/admin/login";
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/san-pham", label: "Sản phẩm" },
    { href: "/admin/don-hang", label: "Đơn hàng" },
    { href: "/admin/ma-giam-gia", label: "Mã giảm giá" },
    { href: "/admin/cai-dat", label: "Cài đặt" },
  ];

  return (
    <>
      <nav className="bg-espresso text-cream px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-heading text-lg font-light tracking-widest text-blush uppercase">
              TRANH ANH STORE
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs uppercase tracking-widest transition-colors ${
                  pathname === item.href
                    ? "text-cream font-medium"
                    : "text-stone-500 hover:text-cream"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-stone-500 hover:text-cream transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 bg-cream min-h-screen">
        {children}
      </main>
    </>
  );
}
