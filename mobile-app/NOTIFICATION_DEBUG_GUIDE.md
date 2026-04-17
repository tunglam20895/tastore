# 🐛 HƯỚNG DẪN DEBUG THÔNG BÁO

## 📱 KIỂM TRA CONSOLE LOGS

Sau khi cập nhật code, bạn sẽ thấy các log này trong console:

### ✅ Logs thành công:

```
🚀 Initializing notification system...
✅ Android notification channel created successfully
📱 Notification permission status: granted
📋 First fetch - loaded 10 notifications
🔄 Polling for new notifications...
🔔 Found 2 new notifications
✅ Local notification scheduled: <notification-id>
✅ Notification system initialized
```

### ❌ Logs lỗi có thể gặp:

```
❌ Failed to create Android notification channel: <error>
→ Giải pháp: Kiểm tra version expo-notifications

⚠️ Notification permission denied by user
→ Giải pháp: Mở Settings → App → Notifications → Bật

❌ Notification permission denied by user
→ Giải pháp: Uninstall app, cài lại, chấp nhận permission

⚠️ Notification permission not granted, skipping local notifications
→ Giải pháp: Bấm "Bật ngay" trên banner màu vàng trong app
```

---

## 🔍 KIỂM TRA TỪNG BƯỚC

### BƯỚC 1: Kiểm tra Permission

**Android:**
1. Vào **Settings** → **Apps** → **TRANG ANH Store**
2. Nhấn **Notifications**
3. Đảm bảo toggle **"Allow notifications"** đang BẬT
4. Kiểm tra category **"Đơn hàng"** đang BẬT

**iOS:**
1. Vào **Settings** → **Notifications** → **TRANG ANH Store**
2. Đảm bảo **"Allow Notifications"** đang BẬT
3. Chọn style: **Banners** hoặc **Alerts**
4. Bật **Sound** và **Badge**

### BƯỚC 2: Kiểm tra Notification Channel (Android Only)

**Trong app:**
1. Mở app
2. Kiểm tra console log có dòng: `✅ Android notification channel created successfully`
3. Nếu không thấy → Có lỗi khi tạo channel

**Trong Settings:**
1. **Settings** → **Apps** → **TRANG ANH Store** → **Notifications**
2. Phải thấy category: **"Đơn hàng"**
3. Bấm vào **"Đơn hàng"**, kiểm tra:
   - ✅ Importance: **Urgent** hoặc **High**
   - ✅ Sound: **Default**
   - ✅ Vibration: **ON**
   - ✅ Override Do Not Disturb: **ON**

### BƯỚC 3: Test Notification

**Test 1: Tạo thông báo thủ công từ server**

Giả sử server API của bạn là REST:

```bash
# POST request tạo đơn hàng mới (hoặc trigger tạo notification)
curl -X POST http://localhost:3000/api/don-hang \
  -H "Content-Type: application/json" \
  -d '{
    "tenKH": "Nguyễn Văn A",
    "tongTien": 500000,
    "trangThai": "Mới"
  }'
```

**Test 2: Trigger từ web admin**

1. Mở web admin (hoặc dùng Postman/Thunder Client)
2. Tạo đơn hàng mới
3. Đợi 10 giây (interval polling)
4. Kiểm tra xem notification có hiện không

**Test 3: Xem logs**

```
🔄 Polling for new notifications...
🔔 Found 1 new notifications
✅ Local notification scheduled: abc-123-xyz
```

---

## 🧪 DEBUG CHECKLIST

### Notification KHÔNG hiển thị?

- [ ] **1. Kiểm tra Permission**
  ```
  Console log: 📱 Notification permission status: granted
  ```
  - Nếu `denied` → Vào Settings bật lại

- [ ] **2. Kiểm tra Android Channel**
  ```
  Console log: ✅ Android notification channel created successfully
  ```
  - Nếu không thấy → Có lỗi, kiểm tra lại code

- [ ] **3. Kiểm tra Polling**
  ```
  Console log: 🔄 Polling for new notifications...
  ```
  - Nếu không thấy → Interval không chạy, kiểm tra useEffect

- [ ] **4. Kiểm tra có notification mới không**
  ```
  Console log: 🔔 Found 2 new notifications
  ```
  - Nếu `Found 0` → Server chưa có data mới

- [ ] **5. Kiểm tra notification scheduled**
  ```
  Console log: ✅ Local notification scheduled: <id>
  ```
  - Nếu không thấy → Có lỗi trong scheduleLocalNotification

- [ ] **6. Kiểm tra Do Not Disturb (Android)**
  - Tắt chế độ Không làm phiền
  - Hoặc vào Settings → Notifications → Đơn hàng → Bật "Override DND"

- [ ] **7. Kiểm tra Battery Optimization (Android)**
  - Settings → Apps → TRANG ANH Store → Battery
  - Chọn **"Unrestricted"** hoặc **"Not optimized"**

---

## 🎯 TEST CASES

### Test Case 1: Foreground (App đang mở)

**Kịch bản:**
1. Mở app
2. Để app ở dashboard
3. Từ backend/admin web, tạo đơn hàng mới
4. Đợi tối đa 10 giây

**Kết quả mong đợi:**
- ✅ Console log: `🔔 Found 1 new notifications`
- ✅ Console log: `✅ Local notification scheduled`
- ✅ Notification hiển thị ở top màn hình (banner)
- ✅ Có sound + vibrate

### Test Case 2: Background (App minimize)

**Kịch bản:**
1. Mở app
2. Nhấn Home button (minimize app, không force quit)
3. Từ backend/admin web, tạo đơn hàng mới
4. Đợi tối đa 10 giây

**Kết quả mong đợi:**
- ✅ Notification hiển thị trong status bar
- ✅ Có sound + vibrate
- ⚠️ **LƯU Ý:** App phải còn chạy background, không bị kill bởi hệ thống

### Test Case 3: Killed (App đóng hoàn toàn)

**Kịch bản:**
1. Mở app
2. Swipe up (force quit app)
3. Từ backend/admin web, tạo đơn hàng mới

**Kết quả mong đợi:**
- ❌ **KHÔNG NHẬN ĐƯỢC** notification

**Lý do:** Expo Notifications chỉ hỗ trợ local notifications khi app đang chạy (foreground hoặc background). Khi app bị kill hoàn toàn, không còn polling → không có notification.

**Giải pháp:** Nâng cấp lên Firebase Cloud Messaging (xem `NOTIFICATION_FIREBASE_UPGRADE.md`)

---

## 🔧 FIX COMMON ISSUES

### Issue 1: "Notification permission denied"

**Triệu chứng:**
```
⚠️ User denied notification permission
```

**Giải pháp:**
1. **Uninstall app** hoàn toàn
2. **Cài lại app**
3. Khi popup xin quyền hiện lên → Nhấn **"Allow"**

Hoặc:

1. **Settings** → **Apps** → **TRANG ANH Store** → **Notifications**
2. Bật **"Allow notifications"**

### Issue 2: Notification không có sound

**Triệu chứng:** Notification hiển thị nhưng không có tiếng

**Giải pháp:**
1. Kiểm tra điện thoại có đang ở chế độ rung không
2. Tăng volume notification lên
3. **Android:**
   - Settings → Apps → TRANG ANH Store → Notifications → Đơn hàng
   - Kiểm tra **Sound: Default**
4. **iOS:**
   - Settings → Notifications → TRANG ANH Store
   - Bật **Sounds**

### Issue 3: Notification không rung

**Giải pháp:**
- Tắt chế độ Không làm phiền
- Bật Vibration trong Settings → Sound & vibration

### Issue 4: Notification delay quá lâu

**Triệu chứng:** Notification xuất hiện sau 30 giây - 1 phút

**Giải pháp:**
- Hiện tại polling interval = 10 giây
- Giảm xuống 5 giây (nhưng tốn battery hơn):
  ```typescript
  interval = setInterval(fetchNotifications, 5000); // 5 giây
  ```

### Issue 5: Duplicate notifications

**Triệu chứng:** Nhận 2-3 notification giống nhau

**Giải pháp:**
- Đã fix bằng cách dùng `knownIdsRef` để track ID đã bắn
- Nếu vẫn bị → Kiểm tra server có trả về duplicate data không

### Issue 6: Cannot create Android channel

**Triệu chứng:**
```
❌ Failed to create Android notification channel
```

**Giải pháp:**
1. Kiểm tra version `expo-notifications`:
   ```bash
   npx expo install expo-notifications
   ```
2. Rebuild app:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

---

## 📊 MONITORING

### Xem notification history (Android)

1. **Settings** → **Apps & notifications** → **Notifications**
2. Scroll xuống → **Notification history**
3. Bật **"Use notification history"**
4. Xem tất cả notifications đã nhận

### Check log real-time

**React Native Debugger:**
```bash
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

**Expo CLI:**
```bash
npx expo start
# Nhấn "j" để mở Chrome DevTools
```

---

## 💡 TIPS & BEST PRACTICES

### 1. Test trên thiết bị thật, không dùng emulator

Emulator/Simulator có thể có vấn đề với notifications

### 2. Clear app data nếu có vấn đề

**Android:**
- Settings → Apps → TRANG ANH Store → Storage → **Clear Data**
- Mở lại app

### 3. Kiểm tra Battery Saver mode

Một số điện thoại (Xiaomi, Oppo, Huawei) có Battery Saver mode kill background apps rất nhanh

**Giải pháp:**
- Settings → Battery → TRANG ANH Store → **Unrestricted**

### 4. Test với nhiều loại notification

```typescript
// Test với đơn mới
const notif1 = { id: '1', loai: 'don_moi', tenKH: 'A', tongTien: 100000 };

// Test với cập nhật
const notif2 = { id: '2', loai: 'cap_nhat', tenKH: 'B', trangThaiCu: 'Mới', trangThaiMoi: 'Đang xử lý' };
```

---

## 📞 CẦN HỖ TRỢ?

Nếu vẫn gặp vấn đề sau khi làm theo tất cả các bước trên:

1. **Chụp screenshot console logs** (toàn bộ từ khi app khởi động)
2. **Chụp screenshot Settings → Notifications**
3. **Mô tả chi tiết:**
   - Loại thiết bị (Android/iOS, version OS)
   - Test case nào không hoạt động
   - Error messages cụ thể

---

## 🎉 CHECKLIST HOÀN THÀNH

Sau khi fix, bạn phải thấy:

- [x] ✅ Console log: `✅ Android notification channel created successfully`
- [x] ✅ Console log: `📱 Notification permission status: granted`
- [x] ✅ Console log: `✅ Notification system initialized`
- [x] ✅ Polling hoạt động: `🔄 Polling for new notifications...`
- [x] ✅ Phát hiện notification mới: `🔔 Found X new notifications`
- [x] ✅ Bắn notification: `✅ Local notification scheduled`
- [x] ✅ Notification hiển thị trên status bar (khi app minimize)
- [x] ✅ Có sound + vibrate
- [x] ✅ Tap vào notification → mở app → điều hướng đúng trang

**Nếu tất cả đều ✅ → Chúc mừng! Hệ thống thông báo đã hoạt động!** 🎊
