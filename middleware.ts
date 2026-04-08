import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyStaffToken } from "@/lib/staff-auth";

// Map route segment → key quyền yêu cầu
const ROUTE_QUYEN: Record<string, string> = {
  "dashboard":   "dashboard",
  "san-pham":    "san-pham",
  "don-hang":    "don-hang",
  "khach-hang":  "khach-hang",
  "ma-giam-gia": "ma-giam-gia",
  // cai-dat và nhan-vien: admin only (không có trong map → chỉ admin)
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") return NextResponse.next();

  const adminCookie = request.cookies.get("admin-auth");
  if (adminCookie?.value === "true") return NextResponse.next(); // Admin: full access

  // Kiểm tra staff token
  const staffToken = request.cookies.get("staff-token")?.value;
  if (staffToken) {
    const session = await verifyStaffToken(staffToken);
    if (session) {
      // Lấy segment route (/admin/don-hang → "don-hang")
      const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
      const requiredQuyen = ROUTE_QUYEN[segment];

      // Route cần quyền cụ thể → kiểm tra
      if (requiredQuyen) {
        if (session.quyen.includes(requiredQuyen)) return NextResponse.next();
        // Không có quyền → redirect về route đầu tiên được phép
        const firstAllowed = Object.entries(ROUTE_QUYEN).find(([, q]) => session.quyen.includes(q));
        const redirectTo = firstAllowed ? `/admin/${firstAllowed[0]}` : "/admin/login";
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }

      // Route admin-only (cai-dat, nhan-vien, ...) → không cho staff
      if (segment && segment !== "") {
        const firstAllowed = Object.entries(ROUTE_QUYEN).find(([, q]) => session.quyen.includes(q));
        const redirectTo = firstAllowed ? `/admin/${firstAllowed[0]}` : "/admin/login";
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }

      return NextResponse.next();
    }
  }

  // Không có session hợp lệ → về login
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
