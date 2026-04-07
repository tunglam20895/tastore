import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("admin-auth");
  const isAuthenticated = authCookie?.value === "true";

  if (!isAuthenticated) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
