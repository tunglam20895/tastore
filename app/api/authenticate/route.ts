import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Missing password" },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Sai mật khẩu" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xác thực" },
      { status: 500 }
    );
  }
}
