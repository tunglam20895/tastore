import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { verifyPassword, createStaffToken } from "@/lib/staff-auth";
import { supabase } from "@/lib/supabase";
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, username } = body;

    // ── Đăng nhập Admin (chỉ password) ──────────────────────────────────────
    if (!username && password) {
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ success: false, error: "Sai mật khẩu" }, { status: 401, headers: CORS_HEADERS });
      }
      const response = NextResponse.json({ success: true, role: "admin" }, { headers: CORS_HEADERS });
      const cookieBase = {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24,
      };
      response.cookies.set("admin-auth", "true", { ...cookieBase, httpOnly: true });
      response.cookies.set("admin-role", "true", cookieBase);
      return response;
    }

    // ── Đăng nhập Nhân viên (username + password) ───────────────────────────
    if (username && password) {
      const { data: nv } = await supabase
        .from("nhan_vien")
        .select("id, ten, username, password_hash, quyen, con_hoat_dong")
        .eq("username", username.trim())
        .single();

      if (!nv) {
        return NextResponse.json({ success: false, error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401, headers: CORS_HEADERS });
      }
      if (!nv.con_hoat_dong) {
        return NextResponse.json({ success: false, error: "Tài khoản đã bị vô hiệu hóa" }, { status: 401, headers: CORS_HEADERS });
      }

      const ok = await verifyPassword(password, nv.password_hash as string);
      if (!ok) {
        return NextResponse.json({ success: false, error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401, headers: CORS_HEADERS });
      }

      const session = {
        id: nv.id as string,
        ten: nv.ten as string,
        username: nv.username as string,
        quyen: (nv.quyen as string[]) || [],
      };
      const token = await createStaffToken(session);

      const response = NextResponse.json({
        success: true,
        role: "staff",
        quyen: session.quyen,
        ten: session.ten,
        id: session.id,
        staffToken: token,
      }, { headers: CORS_HEADERS });

      const cookieOpts = {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      };

      response.cookies.set("staff-token", token, { ...cookieOpts, httpOnly: true });
      response.cookies.set("staff-quyen", session.quyen.join(","), cookieOpts);
      response.cookies.set("staff-ten", session.ten, cookieOpts);

      return response;
    }

    return NextResponse.json({ success: false, error: "Thiếu thông tin đăng nhập" }, { status: 400, headers: CORS_HEADERS });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Lỗi xác thực" }, { status: 500, headers: CORS_HEADERS });
  }
}
