import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyStaffToken } from "@/lib/staff-auth";
import { verifyAdminToken } from "@/lib/auth";

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

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-password, staff-token, x-requested-with',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight (OPTIONS) for /api routes
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // Add CORS headers to all API responses
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  if (pathname === "/admin/login") return NextResponse.next();

  const adminToken = request.cookies.get("admin-token")?.value;
  if (adminToken && await verifyAdminToken(adminToken)) return NextResponse.next();

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
  matcher: ["/admin/:path*", "/api/:path*"],
};
