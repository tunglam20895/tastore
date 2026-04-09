"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useOrderNotifications, type OrderNotif } from "@/hooks/useOrderNotifications";
import { useTrangThaiDH, getTrangThaiMau } from "@/contexts/TrangThaiDHContext";
import OrderDetailModal from "@/components/admin/OrderDetailModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatTime(s: string) {
  const d = new Date(s);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffH < 24) return `${diffH} giờ trước`;
  if (diffD < 7) return `${diffD} ngày trước`;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString("vi-VN");
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// ─── Hex → rgba helpers ───────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Bell Icon (đẹp hơn — có animation shake khi có thông báo mới) ────────────
function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <span className={`relative inline-flex transition-transform ${hasUnread ? "animate-[bell-shake_0.5s_ease-in-out_2]" : ""}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </span>
  );
}

// ─── Notif Item Component ─────────────────────────────────────────────────────
function NotifItem({
  n,
  onClick,
  trangThais,
}: {
  n: OrderNotif;
  onClick: (donHangId: string) => void;
  trangThais: { key: string; ten: string; mau: string }[];
}) {
  const isDonMoi = n.loai === "don_moi";
  const newColor = getTrangThaiMau(trangThais, n.trangThaiMoi);
  const oldColor = n.trangThaiCu ? getTrangThaiMau(trangThais, n.trangThaiCu) : null;
  const newLabel = trangThais.find((t) => t.key === n.trangThaiMoi)?.ten || n.trangThaiMoi;
  const oldLabel = n.trangThaiCu ? (trangThais.find((t) => t.key === n.trangThaiCu)?.ten || n.trangThaiCu) : null;

  // Màu nền theo loại thông báo — nổi bật, dễ nhìn
  const isUnread = !n.daDoc;
  const accentColor = isDonMoi ? "#3B82F6" : newColor;

  // Unread: nền màu rõ theo trạng thái (opacity cao)
  // Read: nền trắng tách biệt với nền trang cream
  const bgColor = isUnread
    ? (isDonMoi ? "#DBEAFE" : hexToRgba(newColor, 0.35))
    : "#FFFFFF";

  return (
    <div
      className="px-4 py-3 cursor-pointer transition-colors hover:bg-cream/60"
      style={{
        backgroundColor: bgColor,
        borderLeft: `3px solid ${accentColor}`,
        borderBottom: "1px solid rgba(200,169,145,0.15)",
      }}
      onClick={() => onClick(n.donHangId)}
    >
      {/* Header: loại + thời gian */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {!n.daDoc && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isDonMoi ? "#3B82F6" : newColor }} />
          )}
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: isDonMoi ? "#3B82F6" : newColor }}>
            {isDonMoi ? "📦 Đơn mới" : `🔄 ${n.nguoiXuLy || "NV"} đã chuyển`}
          </span>
        </div>
        <span className="text-[10px] text-stone-400">{formatTime(n.thoiGian)}</span>
      </div>

      {/* Khách hàng + SP */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-espresso truncate">{n.tenKH}</p>
          <p className="text-[10px] font-mono text-stone-400 mt-0.5">{n.donHangId}</p>
          {n.tenSP && (
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">
              {n.tenSP}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          {isDonMoi && n.tongTien ? (
            <p className="text-xs font-semibold text-espresso">{formatMoney(n.tongTien)}</p>
          ) : (
            /* Chuyển trạng thái: badge cũ → mới */
            <div className="flex items-center gap-1">
              {oldColor && oldLabel && (
                <>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded line-through"
                    style={{
                      backgroundColor: hexToRgba(oldColor, 0.1),
                      color: oldColor,
                    }}
                  >
                    {oldLabel}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-300">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: hexToRgba(newColor, 0.15),
                  color: newColor,
                }}
              >
                {newLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: người xử lý (cho chuyển trạng thái) */}
      {!isDonMoi && n.nguoiXuLy && (
        <p className="text-[10px] text-stone-400 mt-1.5">
          👤 {n.nguoiXuLy}
        </p>
      )}
    </div>
  );
}

// ─── Main AdminNav ────────────────────────────────────────────────────────────
export default function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { notifs, unreadCount, markAllRead } = useOrderNotifications();
  const { trangThais } = useTrangThaiDH();
  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đọc cookie trong useEffect để tránh hydration mismatch
  // Server & lần đầu client render: luôn hiển thị tất cả nav items
  // Sau đó client load cookie → nếu là staff thì ẩn items không có quyền
  const [isAdmin, setIsAdmin] = useState(true); // Bắt đầu = true để render đầy đủ
  const [staffQuyen, setStaffQuyen] = useState<string[]>([]);
  const [staffTen, setStaffTen] = useState("");
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const role = getCookie("admin-role");
    const isAdm = role === "true";
    const qyen = getCookie("staff-quyen").split(",").filter(Boolean);
    const ten = getCookie("staff-ten");
    setIsAdmin(isAdm);
    setStaffQuyen(qyen);
    setStaffTen(ten);
    setAuthLoaded(true);
  }, []);

  const isStaff = authLoaded && !isAdmin && staffQuyen.length > 0;

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
    { href: "/admin/nhan-vien",   label: "Nhân viên",     quyen: null },
    { href: "/admin/cai-dat",     label: "Cài đặt",       quyen: null },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!authLoaded) return true; // Trước khi load cookie, render tất cả
    if (item.quyen === null) return isAdmin;
    if (isAdmin) return true;
    return staffQuyen.includes(item.quyen);
  });

  // Đếm số lượng từng loại thông báo
  const donMoiCount = notifs.filter((n) => n.loai === "don_moi" && !n.daDoc).length;
  const statusChangeCount = notifs.filter((n) => n.loai === "chuyen_trang_thai" && !n.daDoc).length;

  return (
    <>
      <nav className="bg-white sticky top-0 z-50 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="font-heading text-base font-light tracking-widest text-espresso uppercase shrink-0 pr-3 sm:pr-6 border-r border-stone-200"
          >
            TRANG ANH
          </Link>

          {/* Nav items */}
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

          {/* Bell notification — redesign */}
          <div className="relative pl-3 sm:pl-6 border-l border-stone-200 shrink-0" ref={dropdownRef}>
            <button
              onClick={handleOpenNotif}
              className={`relative flex items-center p-2 rounded-full transition-colors ${
                open ? "bg-cream" : unreadCount > 0 ? "text-stone-600 hover:bg-cream" : "text-stone-400 hover:text-espresso hover:bg-cream/50"
              }`}
              title="Thông báo"
            >
              <BellIcon hasUnread={unreadCount > 0} />
              {/* Badge tổng */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-espresso text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-stone-200 shadow-2xl z-50 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-cream/40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-espresso">
                      Thông báo
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-espresso text-cream rounded-full font-medium">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {notifs.length > 0 && (
                    <button
                      onClick={() => { router.push("/admin/don-hang"); setOpen(false); }}
                      className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
                    >
                      Xem đơn hàng →
                    </button>
                  )}
                </div>

                {/* Loại thông báo summary */}
                {unreadCount > 0 && (
                  <div className="flex gap-3 px-4 py-2 bg-cream/20 border-b border-stone-50">
                    {donMoiCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        📦 {donMoiCount} đơn mới
                      </span>
                    )}
                    {statusChangeCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                        🔄 {statusChangeCount} chuyển trạng thái
                      </span>
                    )}
                  </div>
                )}

                {/* List */}
                {notifs.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto mb-3 text-stone-300">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-xs text-stone-400">Không có thông báo</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {notifs.map((n) => (
                      <NotifItem
                        key={n.id}
                        n={n}
                        onClick={(id) => { setSelectedOrderId(id); setOpen(false); }}
                        trangThais={trangThais}
                      />
                    ))}
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
  );
}
