import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback, createContext } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getNotifications, markAllNotificationsRead, markNotificationsReadByIds } from '@/src/api/thong-bao';
import type { OrderNotif } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { formatMoney } from '@/src/utils/format';

export type NotificationContextType = ReturnType<typeof useNotifications>;
export const NotificationContext = createContext<NotificationContextType | null>(null);

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

// ─── Tạo Android notification channel với độ ưu tiên cao ──────────────────
async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  
  try {
    await Notifications.setNotificationChannelAsync('don-hang', {
      name: 'Đơn hàng',
      importance: Notifications.AndroidImportance.MAX, // ✅ THAY ĐỔI: MAX thay vì HIGH
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8A991',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      bypassDnd: true, // ✅ MỚI: Vượt qua chế độ Không Làm Phiền
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // ✅ MỚI: Hiển thị trên màn hình khóa
      enableLights: true, // ✅ MỚI: Bật đèn LED
    });
    console.log('✅ Android notification channel created successfully');
  } catch (error) {
    console.error('❌ Failed to create Android notification channel:', error);
  }
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
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          donHangId: notif.donHangId,
          notifId: notif.id,
          loai: notif.loai,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX, // ✅ MỚI: Độ ưu tiên cao nhất
        vibrate: [0, 250, 250, 250], // ✅ MỚI: Rung
        ...(Platform.OS === 'android' && { 
          channelId: 'don-hang',
          // ✅ MỚI: Thêm style cho Android
          color: '#C8A991',
        }),
        ...(Platform.OS === 'ios' && {
          // ✅ MỚI: Cấu hình iOS
          badge: 1,
          sound: 'default',
        }),
      },
      trigger: null, // hiển thị ngay lập tức
    });
    console.log('✅ Local notification scheduled:', identifier);
  } catch (err) {
    console.error('❌ Không thể bắn local notification:', err);
  }
}

/**
 * Hook quản lý thông báo:
 * - Polling /api/thong-bao mỗi 10s
 * - Phát hiện thông báo mới → bắn local notification ra màn hình điện thoại
 * - Đánh dấu đã đọc (single + all)
 */
export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<OrderNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false); // ✅ MỚI: Track permission status

  // Lưu danh sách id đã biết để phát hiện thông báo mới
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ── Xin quyền notification với logging chi tiết ──────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      console.log('📱 Notification permission status:', existing);
      
      if (existing === 'granted') {
        setPermissionGranted(true);
        return true;
      }
      
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('📱 Notification permission after request:', status);
      
      const granted = status === 'granted';
      setPermissionGranted(granted);
      
      if (!granted) {
        console.warn('⚠️ User denied notification permission');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
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
        console.log('📋 First fetch - loaded', data.length, 'notifications');
        return;
      }

      // ✅ MỚI: Kiểm tra permission trước khi bắn notification
      if (!permissionGranted) {
        console.warn('⚠️ Notification permission not granted, skipping local notifications');
        return;
      }

      // Các lần sau: tìm thông báo mới chưa biết → bắn local notification
      const newNotifs = data.filter((n) => !knownIdsRef.current.has(n.id));
      
      if (newNotifs.length > 0) {
        console.log('🔔 Found', newNotifs.length, 'new notifications');
        
        for (const notif of newNotifs) {
          knownIdsRef.current.add(notif.id);
          await scheduleLocalNotification(notif);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, permissionGranted]);

  // ── Khởi động: xin quyền + setup channel + polling ───────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let interval: ReturnType<typeof setInterval>;

    (async () => {
      console.log('🚀 Initializing notification system...');
      
      // Bước 1: Setup Android channel
      await setupAndroidChannel();
      
      // Bước 2: Xin quyền notification
      const granted = await requestPermission();
      
      if (!granted) {
        console.error('❌ Notification permission denied by user');
        return;
      }
      
      // Bước 3: Fetch ngay lập tức
      await fetchNotifications();
      
      // Bước 4: Setup polling
      interval = setInterval(() => {
        console.log('🔄 Polling for new notifications...');
        fetchNotifications();
      }, 10000); // 10 giây
      
      console.log('✅ Notification system initialized');
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, fetchNotifications, requestPermission]);

  // ── Lắng nghe notification tap (user bấm vào thông báo hệ thống) ─────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Notification hiển thị khi app đang mở (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Notification received in foreground:', notification);
      // Không cần làm gì thêm, fetchNotifications đã xử lý
    });

    // User bấm vào thông báo từ màn hình điện thoại → mở app + điều hướng
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 User tapped notification:', response);
      
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
      console.error('❌ markAllRead error:', err);
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
      console.error('❌ markSingleRead error:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    permissionGranted, // ✅ MỚI: Export permission status
    fetchNotifications,
    markAllRead,
    markSingleRead,
  };
}
