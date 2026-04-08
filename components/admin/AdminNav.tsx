"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import { ToastProvider } from "@/contexts/ToastContext";

function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatTime(s: string) {
  const d = new Date(s);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString("vi-VN");
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders, unreadCount, markAllRead, lastRead } = useOrderNotifications();
  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đọc quyền từ cookie (non-httpOnly, chỉ để display)
  const isAdmin = getCookie("admin-role") === "true";
  const staffQuyen = getCookie("staff-quyen").split(",").filter(Boolean);
  const staffTen = getCookie("staff-ten");
  const isStaff = !isAdmin && staffQuyen.length > 0;

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpenNotif = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    if (typeof window !== "undefined") localStorage.removeItem("admin-password");
    window.location.href = "/admin/login";
  };

  const allNavItems = [
    { href: "/admin/dashboard",   label: "Dashboard",     quyen: "dashboard" },
    { href: "/admin/san-pham",    label: "Sản phẩm",      quyen: "san-pham" },
    { href: "/admin/don-hang",    label: "Đơn hàng",      quyen: "don-hang" },
    { href: "/admin/khach-hang",  label: "Khách hàng",    quyen: "khach-hang" },
    { href: "/admin/ma-giam-gia", label: "Mã giảm giá",   quyen: "ma-giam-gia" },
    { href: "/admin/nhan-vien",   label: "Nhân viên",     quyen: null }, // admin only
    { href: "/admin/cai-dat",     label: "Cài đặt",       quyen: null }, // admin only
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.quyen === null) return isAdmin; // chỉ admin
    if (isAdmin) return true;               // admin thấy tất cả
    return staffQuyen.includes(item.quyen); // nhân viên: chỉ quyền được cấp
  });

  return (
    <ToastProvider>
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="font-heading text-base font-light tracking-widest text-espresso uppercase shrink-0 pr-3 sm:pr-6 border-r border-stone-200"
          >
            TRANH ANH
          </Link>

          {/* Nav items — scrollable on mobile */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto px-3 sm:px-6 scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs uppercase tracking-widest transition-colors rounded-sm whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-espresso text-cream font-semibold"
                    : "text-stone-600 hover:text-espresso hover:bg-stone-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Bell notification */}
          <div className="relative pl-3 sm:pl-6 border-l border-stone-200 shrink-0" ref={dropdownRef}>
            <button
              onClick={handleOpenNotif}
              className="relative flex items-center text-stone-500 hover:text-espresso transition-colors"
              title="Thông báo đơn hàng"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-white border border-stone-200 shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                  <span className="text-xs font-semibold uppercase tracking-widest text-espresso">
                    Đơn mới
                  </span>
                  {orders.length > 0 && (
                    <button
                      onClick={() => { router.push("/admin/don-hang"); setOpen(false); }}
                      className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
                    >
                      Xem tất cả →
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-stone-400">
                    Không có đơn hàng mới
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
                    {orders.map((o) => {
                      const isUnread = o.thoiGian > lastRead;
                      return (
                        <div
                          key={o.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-cream/60 transition-colors ${isUnread ? "bg-rose/5" : ""}`}
                          onClick={() => { setSelectedOrderId(o.id); setOpen(false); }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-rose shrink-0 mt-1" />}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-espresso truncate">{o.tenKH}</p>
                                <p className="text-[10px] font-mono text-stone-400 mt-0.5">{o.id}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-espresso">{formatMoney(o.tongTien)}</p>
                              <p className="text-[10px] text-stone-400 mt-0.5">{formatTime(o.thoiGian)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User info + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-stone-200 shrink-0">
            {isStaff && staffTen && (
              <span className="text-xs text-stone-500 hidden sm:block">{staffTen}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 hover:text-espresso transition-colors"
            >
              <span className="hidden sm:inline">Đăng xuất</span>
              <span className="sm:hidden">Thoát</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 bg-cream min-h-screen">
        {children}
      </main>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={() => setSelectedOrderId(null)}
        />
      )}
    </>
    </ToastProvider>
  );
}
