import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { legacyColors } from '@/src/theme/legacy-colors';
import { useContext, useState } from 'react';
import { NotificationContext } from '@/src/hooks/useNotifications';

/**
 * Banner hiển thị khi user chưa cấp quyền thông báo
 * Chỉ hiển thị trên mobile (không hiển thị trên web)
 */
export default function NotificationPermissionBanner() {
  const notifCtx = useContext(NotificationContext);
  const [dismissed, setDismissed] = useState(false);

  // Không hiển thị trên web
  if (Platform.OS === 'web') return null;
  
  // Không hiển thị nếu đã cấp quyền hoặc user đã dismiss
  if (notifCtx?.permissionGranted || dismissed) return null;

  const handleOpenSettings = () => {
    // Mở Settings app để user cấp quyền thủ công
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={s.container}>
      <View style={s.iconContainer}>
        <Ionicons name="notifications-off-outline" size={24} color={legacyColors.danger} />
      </View>
      
      <View style={s.textContainer}>
        <Text style={s.title}>Bật thông báo để không bỏ lỡ đơn hàng mới</Text>
        <Text style={s.subtitle}>
          Bạn sẽ nhận được thông báo ngay khi có đơn hàng mới hoặc cập nhật
        </Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={s.btnSettings}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={s.btnSettingsText}>Bật ngay</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={s.btnDismiss}
          onPress={() => setDismissed(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={legacyColors.stone[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD', // Light yellow warning color
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: legacyColors.danger,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: legacyColors.espresso,
  },
  subtitle: {
    fontSize: 12,
    color: legacyColors.stone[600],
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSettings: {
    backgroundColor: legacyColors.espresso,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSettingsText: {
    color: legacyColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  btnDismiss: {
    padding: 4,
  },
});
