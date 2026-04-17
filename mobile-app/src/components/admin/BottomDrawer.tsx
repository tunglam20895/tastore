import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  Dimensions, Platform,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { NotificationContext } from '@/src/hooks/useNotifications';
import { colors, shadows, borderRadius } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '@/src/api/auth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.75;

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: 'stats-chart' as const, label: 'Dashboard', route: '/(admin)/dashboard', quyen: 'dashboard' },
  { icon: 'shirt' as const, label: 'Sản phẩm', route: '/(admin)/san-pham', quyen: 'san-pham' },
  { icon: 'receipt' as const, label: 'Đơn hàng', route: '/(admin)/don-hang', quyen: 'don-hang' },
  { icon: 'people' as const, label: 'Khách hàng', route: '/(admin)/khach-hang', quyen: 'khach-hang' },
  { icon: 'pricetags' as const, label: 'Mã giảm giá', route: '/(admin)/ma-giam-gia', quyen: 'ma-giam-gia' },
  { icon: 'people' as const, label: 'Nhân viên', route: '/(admin)/nhan-vien', quyen: 'admin-only' },
  { icon: 'settings' as const, label: 'Cài đặt', route: '/(admin)/cai-dat', quyen: 'admin-only' },
  { icon: 'sparkles' as const, label: 'Trợ lý AI', route: '/(admin)/ai-chat', quyen: 'dashboard', isSpecial: true },
];

export default function BottomDrawer({ visible, onClose }: BottomDrawerProps) {
  const router = useRouter();
  const { role, staffTen, staffQuyen, logout: logoutStore } = useAuthStore();
  const notifCtx = useContext(NotificationContext);
  const unreadCount = notifCtx?.unreadCount ?? 0;
  const isAdmin = role === 'admin';

  const hasPermission = (quyen: string | null) => {
    if (!quyen) return true;
    if (quyen === 'admin-only') return isAdmin;
    return isAdmin || staffQuyen.some(q => q.toLowerCase() === quyen?.toLowerCase());
  };

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    await logoutStore();
    router.replace('/(auth)/login');
  };

  const roleLabel = isAdmin ? '👑 Quản trị viên' : `👤 Nhân viên`;
  const initials = (staffTen || 'NV').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredItems = menuItems.filter(item => hasPermission(item.quyen));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.drawer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{staffTen || 'User'}</Text>
              <Text style={styles.userRole}>{roleLabel}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.stone[400]} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Menu Items */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuSectionTitle}>Điều hướng</Text>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.6}
              >
                <View style={[styles.menuIconWrap, item.isSpecial && styles.menuIconWrapSpecial]}>
                  <Ionicons name={item.icon} size={20} color={item.isSpecial ? colors.blush : colors.espresso} />
                  {item.label === 'Đơn hàng' && unreadCount > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.menuLabel, item.isSpecial && styles.menuLabelSpecial]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.drawerFooter}>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.6}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Trang Anh Store v1.0</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: DRAWER_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    ...shadows.card,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.espresso,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
    letterSpacing: 1,
  },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 17, fontWeight: '700', color: colors.espresso },
  userRole: { fontSize: 12, color: colors.stone[400], marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: `${colors.stone[100]}80` },
  divider: { height: 1, backgroundColor: colors.stone[100] },
  menuList: { paddingVertical: 8 },
  menuSectionTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.stone[400],
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.blush}15`,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuIconWrapSpecial: { backgroundColor: `${colors.blush}25` },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  menuBadgeText: { fontSize: 8, fontWeight: '700', color: colors.white },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.espresso,
    marginLeft: 14,
  },
  menuLabelSpecial: { color: colors.blush, fontWeight: '600' },
  drawerFooter: { paddingTop: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  logoutText: { fontSize: 15, color: colors.danger, fontWeight: '600', marginLeft: 14 },
  versionText: { textAlign: 'center', fontSize: 11, color: colors.stone[300], marginTop: 4 },
});
