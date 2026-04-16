import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getNotifications, markAllNotificationsRead, markNotificationsReadByIds } from '@/src/api/thong-bao';
import type { OrderNotif } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { formatMoney } from '@/src/utils/format';

// ─── Cấu hình hiển thị notification khi app đang mở ───────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Tạo Android notification channel ──────────────────────────────────────
async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('don-hang', {
    name: 'Đơn hàng',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C8A991',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

// ─── Bắn local notification ra màn hình điện thoại ─────────────────────────
async function scheduleLocalNotification(notif: OrderNotif) {
  const isNew = notif.loai === 'don_moi';

  const title = isNew ? '📦 Đơn hàng mới!' : '🔄 Cập nhật đơn hàng';
  let body = '';
  if (isNew) {
    body = `${notif.tenKH}${notif.tongTien ? ' · ' + formatMoney(notif.tongTien) : ''}`;
  } else {
    body = `${notif.tenKH}: ${notif.trangThaiCu || ''} → ${notif.trangThaiMoi}`;
  }

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
        ...(Platform.OS === 'android' && { channelId: 'don-hang' }),
      },
      trigger: null, // hiển thị ngay lập tức
    });
  } catch (err) {
    console.warn('[Notification] Không thể bắn local notification:', err);
  }
}

/**
 * Hook quản lý thông báo:
 * - Polling /api/thong-bao mỗi 30s
 * - Phát hiện thông báo mới → bắn local notification ra màn hình điện thoại
 * - Đánh dấu đã đọc (single + all)
 */
export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<OrderNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lưu danh sách id đã biết để phát hiện thông báo mới
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ── Xin quyền notification ────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  // ── Fetch + phát hiện thông báo mới ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await getNotifications() as OrderNotif[];
      setNotifications(data);
      const unread = data.filter((n) => !n.daDoc);
      setUnreadCount(unread.length);

      // Lần fetch đầu tiên: chỉ ghi nhớ danh sách, không bắn notification
      if (isFirstFetchRef.current) {
        data.forEach((n) => knownIdsRef.current.add(n.id));
        isFirstFetchRef.current = false;
        return;
      }

      // Các lần sau: tìm thông báo mới chưa biết → bắn local notification
      const newNotifs = data.filter((n) => !knownIdsRef.current.has(n.id));
      for (const notif of newNotifs) {
        knownIdsRef.current.add(notif.id);
        await scheduleLocalNotification(notif);
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ── Khởi động: xin quyền + setup channel + polling ───────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      await setupAndroidChannel();
      await requestPermission();
      await fetchNotifications();
    })();

    // Polling mỗi 10 giây
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications, requestPermission]);

  // ── Lắng nghe notification tap (user bấm vào thông báo hệ thống) ─────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Notification hiển thị khi app đang mở (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Không cần làm gì thêm, fetchNotifications đã xử lý
    });

    // User bấm vào thông báo từ màn hình điện thoại → mở app + điều hướng
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      const donHangId = data?.donHangId;
      const notifId = data?.notifId;

      if (donHangId) {
        // Đánh dấu đã đọc
        if (notifId) {
          markNotificationsReadByIds([notifId]).catch(() => {});
          setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, daDoc: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        // Điều hướng đến chi tiết đơn hàng
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

  // ── Đánh dấu tất cả đã đọc ───────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, daDoc: true })));
      setUnreadCount(0);
      await markAllNotificationsRead();
    } catch (err) {
      console.error('markAllRead error:', err);
      fetchNotifications();
    }
  };

  // ── Đánh dấu một thông báo đã đọc ────────────────────────────────────────
  const markSingleRead = async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id && !n.daDoc);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, daDoc: true } : n))
    );
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationsReadByIds([id]);
    } catch (err) {
      console.error('markSingleRead error:', err);
    }
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
