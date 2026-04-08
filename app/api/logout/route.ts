import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const clear = { maxAge: 0, path: "/" };
  response.cookies.set("admin-auth", "", clear);
  response.cookies.set("admin-role", "", clear);
  response.cookies.set("staff-token", "", clear);
  response.cookies.set("staff-quyen", "", clear);
  response.cookies.set("staff-ten", "", clear);
  return response;
}
