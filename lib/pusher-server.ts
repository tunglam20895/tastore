import Pusher from 'pusher';

export const NOTIFICATIONS_CHANNEL = 'private-notifications';
export const NOTIFICATIONS_SYNC_EVENT = 'notifications:sync';

let pusherServer: Pusher | null | undefined;

function getPusherConfig() {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) return null;
  return { appId, key, secret, cluster };
}

export function isPusherConfigured() {
  return !!getPusherConfig();
}

export function getPusherServer() {
  if (pusherServer !== undefined) return pusherServer;

  const config = getPusherConfig();
  if (!config) {
    pusherServer = null;
    return pusherServer;
  }

  pusherServer = new Pusher({
    appId: config.appId,
    key: config.key,
    secret: config.secret,
    cluster: config.cluster,
    useTLS: true,
  });

  return pusherServer;
}

export async function triggerNotificationSync(reason: string) {
  const pusher = getPusherServer();
  if (!pusher) return false;

  await pusher.trigger(NOTIFICATIONS_CHANNEL, NOTIFICATIONS_SYNC_EVENT, {
    reason,
    timestamp: new Date().toISOString(),
  });

  return true;
}
