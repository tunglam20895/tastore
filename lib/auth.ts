import type { NextRequest } from 'next/server';
import { verifyStaffToken } from './staff-auth';

const enc = new TextEncoder();
const dec = new TextDecoder();
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

type AdminSessionPayload = {
  role: 'admin';
  exp: number;
};

function encodePayload(obj: object): string {
  const bytes = enc.encode(JSON.stringify(obj));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodePayload<T>(str: string): T {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(dec.decode(bytes)) as T;
}

async function hmacSign(data: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? 'change-me';
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

export async function createAdminToken(): Promise<string> {
  const payload = encodePayload({
    role: 'admin',
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  } satisfies AdminSessionPayload);
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = await hmacSign(payload);
    if (sig !== expected) return false;

    const data = decodePayload<AdminSessionPayload>(payload);
    return data.role === 'admin' && typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function hasAdminAccess(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin-token')?.value;
  if (token && await verifyAdminToken(token)) return true;

  const pw = request.headers.get('x-admin-password');
  return !!(pw && verifyAdminPassword(pw));
}

export async function getAuthenticatedActorName(request: NextRequest): Promise<string | null> {
  if (await hasAdminAccess(request)) return 'Admin';

  const token =
    request.headers.get('staff-token') ||
    request.cookies.get('staff-token')?.value;
  if (!token) return null;

  const session = await verifyStaffToken(token);
  return session?.ten ?? null;
}

/**
 * Xác thực quyền truy cập API: chấp nhận admin session/cookie, fallback admin password header, hoặc staff token.
 * @param requiredQuyen - key quyền cần có (null = chỉ admin mới được phép)
 */
export async function verifyAccess(request: NextRequest, requiredQuyen?: string): Promise<boolean> {
  if (await hasAdminAccess(request)) return true;

  if (!requiredQuyen) return false; // route admin-only
  const token =
    request.headers.get('staff-token') ||          // mobile app gửi qua header
    request.cookies.get('staff-token')?.value;      // web admin dùng cookie
  if (!token) return false;
  const session = await verifyStaffToken(token);
  if (!session) return false;
  return session.quyen.includes(requiredQuyen);
}
