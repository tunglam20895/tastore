import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback, createContext } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getNotifications, markAllNotificationsRead, markNotificationsReadByIds } from '@/src/api/thong-bao';
import { getRealtimeConfig } from '@/src/api/realtime';
import type { OrderNotif } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { formatMoney } from '@/src/utils/format';
import { API_URL } from '@/src/utils/constants';

export type NotificationContextType = ReturnType<typeof useNotifications>;
export const NotificationContext = createContext<NotificationContextType | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('don-hang', {
      name: 'Đơn hàng',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8A991',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
    });
  } catch (error) {
    console.error('❌ Failed to create Android notification channel:', error);
  }
}

async function scheduleLocalNotification(notif: OrderNotif) {
  const isNew = notif.loai === 'don_moi';
  const title = isNew ? '📦 Đơn hàng mới!' : '🔄 Cập nhật đơn hàng';
  const body = isNew
    ? `${notif.tenKH}${notif.tongTien ? ' · ' + formatMoney(notif.tongTien) : ''}`
    : `${notif.tenKH}: ${notif.trangThaiCu || ''} → ${notif.trangThaiMoi}`;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          donHangId: notif.donHangId,
          notifId: notif.id,
          loai: notif.loai,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        ...(Platform.OS === 'android' && {
          channelId: 'don-hang',
          color: '#C8A991',
        }),
        ...(Platform.OS === 'ios' && {
          badge: 1,
          sound: 'default',
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.error('❌ Không thể bắn local notification:', err);
  }
}

function sortNotifications(items: OrderNotif[]) {
  return [...items].sort(
    (a, b) => new Date(b.thoiGian).getTime() - new Date(a.thoiGian).getTime()
  );
}

function getPusherConstructor() {
  const mod = Platform.OS === 'web' ? require('pusher-js') : require('pusher-js/react-native');
  return mod.default || mod;
}

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<OrderNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'connecting' | 'connected' | 'fallback'>('idle');

  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);
  const permissionGrantedRef = useRef(false);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const backupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const replaceNotifications = useCallback((items: OrderNotif[]) => {
    const sorted = sortNotifications(items).slice(0, 50);
    setNotifications(sorted);
    setUnreadCount(sorted.filter((n) => !n.daDoc).length);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') {
        permissionGrantedRef.current = true;
        setPermissionGranted(true);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      permissionGrantedRef.current = granted;
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      permissionGrantedRef.current = false;
      setPermissionGranted(false);
      return false;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = (await getNotifications()) as OrderNotif[];
      replaceNotifications(data);

      if (isFirstFetchRef.current) {
        knownIdsRef.current = new Set(data.map((n) => n.id));
        isFirstFetchRef.current = false;
        return;
      }

      if (!permissionGrantedRef.current) return;

      const newNotifs = data.filter((n) => !knownIdsRef.current.has(n.id));
      for (const notif of newNotifs) {
        knownIdsRef.current.add(notif.id);
        await scheduleLocalNotification(notif);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, replaceNotifications]);

  const clearRealtimeResources = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
      backupIntervalRef.current = null;
    }
    if (channelRef.current && pusherRef.current) {
      try {
        pusherRef.current.unsubscribe(channelRef.current.name);
      } catch {}
    }
    if (pusherRef.current) {
      try {
        pusherRef.current.disconnect();
      } catch {}
    }
    channelRef.current = null;
    pusherRef.current = null;
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      fetchNotifications();
    }, 350);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearRealtimeResources();
      knownIdsRef.current = new Set();
      isFirstFetchRef.current = true;
      permissionGrantedRef.current = false;
      setPermissionGranted(false);
      setRealtimeStatus('idle');
      replaceNotifications([]);
      return;
    }

    let cancelled = false;

    (async () => {
      await setupAndroidChannel();
      await requestPermission();
      await fetchNotifications();
      if (cancelled) return;

      try {
        const config = await getRealtimeConfig();
        if (cancelled) return;

        if (!config.enabled || !config.key || !config.cluster || !config.notificationsChannel) {
          setRealtimeStatus('fallback');
          backupIntervalRef.current = setInterval(fetchNotifications, 60000);
          return;
        }

        setRealtimeStatus('connecting');

        const authState = useAuthStore.getState();
        const headers: Record<string, string> = {};
        if (authState.role === 'admin' && authState.adminToken) {
          headers['admin-token'] = authState.adminToken;
        } else if (authState.role === 'staff' && authState.staffToken) {
          headers['staff-token'] = authState.staffToken;
        }

        const Pusher = getPusherConstructor();
        const pusher = new Pusher(config.key, {
          cluster: config.cluster,
          forceTLS: true,
          channelAuthorization: {
            endpoint: `${API_URL}/api/pusher/auth`,
            transport: 'ajax',
            headers,
          },
        });

        pusher.connection.bind('connected', () => setRealtimeStatus('connected'));
        pusher.connection.bind('error', (error: unknown) => {
          console.error('❌ Pusher connection error:', error);
          setRealtimeStatus('fallback');
        });

        const channel = pusher.subscribe(config.notificationsChannel);
        channel.bind('pusher:subscription_error', (error: unknown) => {
          console.error('❌ Notification channel subscription error:', error);
          setRealtimeStatus('fallback');
        });
        channel.bind('notifications:sync', () => {
          scheduleSync();
        });

        pusherRef.current = pusher;
        channelRef.current = channel;

        backupIntervalRef.current = setInterval(fetchNotifications, 300000);
      } catch (error) {
        console.error('❌ Failed to initialize realtime notifications:', error);
        setRealtimeStatus('fallback');
        backupIntervalRef.current = setInterval(fetchNotifications, 60000);
      }
    })();

    return () => {
      cancelled = true;
      clearRealtimeResources();
    };
  }, [clearRealtimeResources, fetchNotifications, isAuthenticated, replaceNotifications, requestPermission, scheduleSync]);

  useEffect(() => {
    if (!isAuthenticated) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      const donHangId = data?.donHangId;
      const notifId = data?.notifId;

      if (notifId) {
        markNotificationsReadByIds([notifId]).catch(() => {});
        setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, daDoc: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (donHangId) {
        setTimeout(() => {
          router.push({
            pathname: '/(admin)/don-hang/[id]',
            params: { id: donHangId },
          });
        }, 300);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, router]);

  const markAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, daDoc: true })));
      setUnreadCount(0);
      await markAllNotificationsRead();
    } catch (err) {
      console.error('❌ markAllRead error:', err);
      fetchNotifications();
    }
  };

  const markSingleRead = async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id && !n.daDoc);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, daDoc: true } : n)));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationsReadByIds([id]);
    } catch (err) {
      console.error('❌ markSingleRead error:', err);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    permissionGranted,
    realtimeStatus,
    fetchNotifications,
    markAllRead,
    markSingleRead,
  };
}
