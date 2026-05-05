/**
 * CORS headers cho tất cả API responses
 * Dùng cho mobile app và các client khác origin
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, admin-token, x-admin-password, staff-token, x-requested-with',
  'Access-Control-Max-Age': '86400',
} as const;

/** Trả về response cho OPTIONS preflight */
export function handleOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Wrap một NextResponse để thêm CORS headers */
export function withCors(response: Response): Response {
  const newRes = new Response(response.body, response);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => newRes.headers.set(k, v));
  return newRes;
}
