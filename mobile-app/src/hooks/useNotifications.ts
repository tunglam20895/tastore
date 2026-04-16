import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getNotifications, markNotificationsRead } from '@/src/api/thong-bao';
import type { OrderNotif } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook quản lý thông báo:
 * - Polling /api/thong-bao mỗi 60s
 * - Đánh dấu đã đọc
 * - Push notification setup (expo-notifications)
 */
export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<OrderNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getNotifications();
      const data = (res as any)?.data || res || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: OrderNotif) => !n.daDoc).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Polling mỗi 60s
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Setup push notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id',
        });

        // TODO: Gửi push token lên server
        // await apiClient.post('/api/push-token', { token: pushToken.data });
      } catch {
        // ignore
      }
    })();

    // Lắng nghe notification received khi app đang mở
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      fetchNotifications();
    });

    // Lắng nghe user tap notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigate đến trang đơn hàng
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, fetchNotifications]);

  const markAllRead = async () => {
    try {
      // Send explicit empty body so backend marks ALL as read
      await markNotificationsRead({ markAll: true });
      setNotifications(prev => prev.map(n => ({ ...n, daDoc: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllRead error:', err);
    }
  };

  const markSingleRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, daDoc: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllRead,
    markSingleRead,
  };
}
