import type { NextRequest } from 'next/server';
import { verifyStaffToken } from './staff-auth';

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

/**
 * Xác thực quyền truy cập API: chấp nhận admin password header HOẶC staff token cookie.
 * @param requiredQuyen - key quyền cần có (null = chỉ admin mới được phép)
 */
export async function verifyAccess(request: NextRequest, requiredQuyen?: string): Promise<boolean> {
  // 1. Admin password header → full access
  const pw = request.headers.get('x-admin-password');
  if (pw && verifyAdminPassword(pw)) return true;

  // 2. Staff token — check both header (mobile app) and cookie (web admin)
  if (!requiredQuyen) return false; // route admin-only
  const token =
    request.headers.get('staff-token') ||          // mobile app gửi qua header
    request.cookies.get('staff-token')?.value;      // web admin dùng cookie
  if (!token) return false;
  const session = await verifyStaffToken(token);
  if (!session) return false;
  return session.quyen.includes(requiredQuyen);
}
