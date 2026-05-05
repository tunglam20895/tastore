import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CORS_HEADERS, handleOptions } from '@/lib/cors';
import { getPusherServer, NOTIFICATIONS_CHANNEL } from '@/lib/pusher-server';
import { hasAdminAccess } from '@/lib/auth';
import { verifyStaffToken } from '@/lib/staff-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

async function verifyNotificationAccess(request: NextRequest): Promise<boolean> {
  if (await hasAdminAccess(request)) return true;

  const token = request.headers.get('staff-token') || request.cookies.get('staff-token')?.value;
  if (!token) return false;

  const session = await verifyStaffToken(token);
  return !!session;
}

export async function POST(request: NextRequest) {
  try {
    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { success: false, error: 'Realtime chưa được cấu hình' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (!(await verifyNotificationAccess(request))) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const form = await request.formData();
    const socketId = String(form.get('socket_id') || '');
    const channelName = String(form.get('channel_name') || '');

    if (!socketId || !channelName) {
      return NextResponse.json(
        { success: false, error: 'Thiếu socket_id hoặc channel_name' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (channelName !== NOTIFICATIONS_CHANNEL) {
      return NextResponse.json(
        { success: false, error: 'Channel không hợp lệ' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('POST /api/pusher/auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể xác thực realtime' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
