# 🔥 HƯỚNG DẪN NÂNG CẤP LÊN FIREBASE CLOUD MESSAGING

> **LƯU Ý:** Đây là hướng dẫn nếu bạn muốn có **push notifications thật** từ server (không cần app chạy).  
> Hiện tại app đang dùng **polling** (kiểm tra API mỗi 10 giây) + local notifications.

---

## 📋 SO SÁNH 2 PHƯƠNG PHÁP

| Tiêu chí | Expo Notifications (Hiện tại) | Firebase Cloud Messaging |
|----------|--------------------------------|--------------------------|
| **Push thật từ server** | ❌ Không (chỉ local) | ✅ Có |
| **App phải chạy?** | ✅ Phải (polling) | ❌ Không cần |
| **Battery usage** | ⚠️ Cao hơn (polling) | ✅ Tối ưu |
| **Độ phức tạp setup** | ✅ Đơn giản | ⚠️ Phức tạp hơn |
| **Cần Firebase project?** | ❌ Không | ✅ Có |

---

## 🛠️ BƯỚC 1: CÀI ĐẶT DEPENDENCIES

```bash
# Cài đặt Firebase Messaging
npx expo install @react-native-firebase/app @react-native-firebase/messaging

# Cài đặt expo-notifications (giữ lại cho local notifications)
npx expo install expo-notifications
```

---

## 🔧 BƯỚC 2: SETUP FIREBASE PROJECT

### 2.1. Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project existing
3. Thêm app Android với package name: `com.tranhanh.mobile`

### 2.2. Download google-services.json

1. Sau khi thêm app Android, download file `google-services.json`
2. Đặt vào: `android/app/google-services.json`

### 2.3. Setup iOS (nếu cần)

1. Thêm app iOS với bundle ID: `com.tranhanh.mobile`
2. Download `GoogleService-Info.plist`
3. Đặt vào: `ios/GoogleService-Info.plist`

---

## 📝 BƯỚC 3: CẬP NHẬT app.json

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#C8A991",
          "sounds": [],
          "androidMode": "default",
          "androidCollapsedTitle": "#{unread_notifications} thông báo mới"
        }
      ],
      [
        "@react-native-firebase/app",
        {
          "ios": {
            "googleServicesFile": "./GoogleService-Info.plist"
          },
          "android": {
            "googleServicesFile": "./google-services.json"
          }
        }
      ]
    ]
  }
}
```

---

## 📄 BƯỚC 4: TẠO FILE index.js (Root Level)

**Tạo file:** `index.js` (cùng cấp với `index.ts`)

```javascript
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// ✅ QUAN TRỌNG: Background message handler
// Phải đăng ký NGAY tại đầu file, trước khi app khởi động
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 Background message received:', remoteMessage);
  
  // Xử lý notification khi app đóng/chạy ngầm
  // Firebase tự động hiển thị notification nếu có object "notification"
});

AppRegistry.registerComponent(appName, () => App);
```

---

## 🔨 BƯỚC 5: TẠO HOOK useFirebaseNotifications.ts

**Tạo file:** `src/hooks/useFirebaseNotifications.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

// ─── Cấu hình hiển thị notification khi app đang mở ───────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Setup Android Channel ─────────────────────────────────────────────────
async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  
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
}

export function useFirebaseNotifications() {
  const router = useRouter();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // ── Xin quyền Firebase Messaging ─────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('📱 FCM Permission status:', authStatus);
      setPermissionGranted(enabled);
      
      return enabled;
    } catch (error) {
      console.error('❌ Error requesting FCM permission:', error);
      return false;
    }
  }, []);

  // ── Lấy FCM Token ────────────────────────────────────────────────────────
  const getFCMToken = useCallback(async () => {
    try {
      const token = await messaging().getToken();
      console.log('🔑 FCM Token:', token);
      setFcmToken(token);
      
      // TODO: Gửi token này lên server để lưu vào database
      // await sendTokenToServer(token);
      
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }, []);

  // ── Khởi tạo ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      console.log('🚀 Initializing Firebase Messaging...');
      
      await setupAndroidChannel();
      const granted = await requestPermission();
      
      if (!granted) {
        console.warn('⚠️ FCM permission denied');
        return;
      }
      
      await getFCMToken();
      
      console.log('✅ Firebase Messaging initialized');
    })();
  }, [requestPermission, getFCMToken]);

  // ── Lắng nghe token refresh ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh((token) => {
      console.log('🔄 FCM Token refreshed:', token);
      setFcmToken(token);
      // TODO: Update token on server
    });

    return unsubscribe;
  }, []);

  // ── Lắng nghe foreground messages ────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('📩 Foreground message received:', remoteMessage);
      
      // Hiển thị local notification khi app đang mở
      const notification = remoteMessage.notification;
      if (notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title || 'Thông báo mới',
            body: notification.body || '',
            data: remoteMessage.data || {},
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'don-hang' }),
          },
          trigger: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  // ── Lắng nghe notification tap ───────────────────────────────────────────
  useEffect(() => {
    // Khi app mở từ trạng thái quit/background
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 App opened from quit state:', remoteMessage);
          handleNotificationTap(remoteMessage);
        }
      });

    // Khi app đang chạy background
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 App opened from background:', remoteMessage);
      handleNotificationTap(remoteMessage);
    });

    return unsubscribe;
  }, [router]);

  // ── Xử lý khi user tap vào notification ──────────────────────────────────
  const handleNotificationTap = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const donHangId = remoteMessage.data?.donHangId;
    
    if (donHangId) {
      setTimeout(() => {
        router.push({
          pathname: '/(admin)/don-hang/[id]',
          params: { id: String(donHangId) },
        });
      }, 500);
    }
  };

  return {
    fcmToken,
    permissionGranted,
    requestPermission,
    getFCMToken,
  };
}
```

---

## 🔌 BƯỚC 6: SỬ DỤNG TRONG APP

**Cập nhật:** `app/(admin)/_layout.tsx`

```typescript
import { useFirebaseNotifications } from '@/src/hooks/useFirebaseNotifications';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const notifHook = useNotifications(); // Hook cũ (polling)
  const fcmHook = useFirebaseNotifications(); // ✅ Hook mới (Firebase)

  // Log FCM token để test
  useEffect(() => {
    if (fcmHook.fcmToken) {
      console.log('FCM Token ready:', fcmHook.fcmToken);
    }
  }, [fcmHook.fcmToken]);

  return (
    <NotificationContext.Provider value={notifHook}>
      {/* ... rest of your code */}
    </NotificationContext.Provider>
  );
}
```

---

## 📤 BƯỚC 7: GỬI NOTIFICATION TỪ SERVER

### Format JSON chuẩn (quan trọng!)

```json
{
  "to": "FCM_TOKEN_CUA_USER",
  "notification": {
    "title": "📦 Đơn hàng mới!",
    "body": "Nguyễn Văn A · 500.000đ"
  },
  "data": {
    "donHangId": "123",
    "notifId": "456",
    "loai": "don_moi"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "don-hang",
      "sound": "default",
      "color": "#C8A991"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### Node.js Example (Backend)

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

async function sendNotification(fcmToken, donHang) {
  const message = {
    token: fcmToken,
    notification: {
      title: '📦 Đơn hàng mới!',
      body: `${donHang.tenKH} · ${donHang.tongTien}đ`,
    },
    data: {
      donHangId: String(donHang.id),
      loai: 'don_moi',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'don-hang',
        sound: 'default',
        color: '#C8A991',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}
```

---

## 🧪 BƯỚC 8: TEST

### Test từ Firebase Console

1. Vào Firebase Console → Cloud Messaging
2. Chọn "Send your first message"
3. Nhập title + body
4. Target: FCM Token (dán token từ console.log)
5. Send test message

### Test từ Postman

```bash
POST https://fcm.googleapis.com/fcm/send
Headers:
  Authorization: key=YOUR_SERVER_KEY
  Content-Type: application/json

Body: (JSON từ bước 7)
```

---

## ⚠️ TROUBLESHOOTING

### 1. Không nhận được notification khi app đóng

**Nguyên nhân:** Thiếu object `notification` trong payload

**Giải pháp:** Đảm bảo JSON có:
```json
{
  "notification": {
    "title": "...",
    "body": "..."
  }
}
```

### 2. Notification không có sound

**Giải pháp:**
- Android: Thêm `"sound": "default"` trong channel
- iOS: Thêm trong `apns.payload.aps`

### 3. Cannot get FCM token

**Giải pháp:**
- Kiểm tra `google-services.json` đã đúng vị trí
- Rebuild app: `npx expo prebuild --clean`
- Clear cache: `npx expo start --clear`

---

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi setup xong:

✅ App nhận được push notifications **ngay cả khi đóng hoàn toàn**  
✅ Notification hiển thị ở status bar với sound + vibrate  
✅ Tap vào notification → mở app → điều hướng đến chi tiết đơn hàng  
✅ Battery usage giảm (không cần polling liên tục)  

---

## 🎯 TỔNG KẾT

- **Expo Notifications (hiện tại):** Đơn giản nhưng chỉ local, cần polling
- **Firebase Cloud Messaging:** Phức tạp hơn nhưng push thật, tối ưu battery

**Khuyến nghị:** Nếu app cần nhận notification **ngay lập tức** khi có đơn mới (không đợi 10s polling), hãy nâng cấp lên Firebase!
