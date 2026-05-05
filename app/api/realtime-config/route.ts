import { NextResponse } from 'next/server';
import { CORS_HEADERS, handleOptions } from '@/lib/cors';
import { NOTIFICATIONS_CHANNEL, isPusherConfigured } from '@/lib/pusher-server';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const enabled = isPusherConfigured();

  return NextResponse.json(
    {
      success: true,
      data: {
        enabled,
        provider: enabled ? 'pusher' : null,
        key: enabled ? process.env.PUSHER_KEY : null,
        cluster: enabled ? process.env.PUSHER_CLUSTER : null,
        notificationsChannel: enabled ? NOTIFICATIONS_CHANNEL : null,
      },
    },
    { headers: CORS_HEADERS }
  );
}
