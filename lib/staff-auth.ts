// Web Crypto API — hoạt động trên cả Node.js 18+ và Edge runtime

const enc = new TextEncoder();
const dec = new TextDecoder();

// ── Encode/decode payload (UTF-8 safe base64) ──────────────────────────────
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

// ── HMAC-SHA256 sign ────────────────────────────────────────────────────────
async function hmacSign(data: string): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? 'change-me';
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

// ── Password hash/verify (PBKDF2) ───────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  const toHex = (a: Uint8Array) => Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const fromHex = (h: string) => new Uint8Array(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: fromHex(saltHex), iterations: 100_000, hash: 'SHA-256' },
      key, 256
    );
    const computed = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return computed === hashHex;
  } catch { return false; }
}

// ── Session token ────────────────────────────────────────────────────────────
export interface StaffSession {
  id: string;
  ten: string;
  username: string;
  quyen: string[];
}

export async function createStaffToken(session: StaffSession): Promise<string> {
  // Không set exp → session tồn tại vĩnh viễn cho đến khi đăng xuất thủ công
  const payload = encodePayload({ ...session });
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyStaffToken(token: string): Promise<StaffSession | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = await hmacSign(payload);
    if (sig !== expected) return null;
    const data = decodePayload<StaffSession & { exp?: number }>(payload);
    // Bỏ kiểm tra exp — token không expire
    return { id: data.id, ten: data.ten, username: data.username, quyen: data.quyen };
  } catch { return null; }
}
