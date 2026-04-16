import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  Dimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '@/app/(admin)/_layout';
import { useAuthStore } from '@/src/store/authStore';
import { colors, shadows } from '@/src/theme';
import { formatMoney, formatRelativeTime } from '@/src/utils/format';
import { STATUS_COLORS } from '@/src/utils/constants';
import BottomDrawer from './BottomDrawer';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AdminHeader() {
  const router = useRouter();
  const { role, staffTen } = useAuthStore();
  const notifCtx = useContext(NotificationContext);
  const notifications = notifCtx?.notifications ?? [];
  const unreadCount = notifCtx?.unreadCount ?? 0;
  const markAllRead = notifCtx?.markAllRead ?? (() => Promise.resolve());
  const markSingleRead = notifCtx?.markSingleRead ?? (() => Promise.resolve());
  const [showNotif, setShowNotif] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const isAdmin = role === 'admin';
  const displayName = isAdmin ? 'Admin' : (staffTen || 'NV');

  const bellBounce = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();
  };

  const handleBellPress = () => {
    bellBounce();
    setShowNotif(true);
  };

  const handleNotifPress = (notif: any) => {
    markSingleRead(notif.id);
    setShowNotif(false);
    if (notif.donHangId) {
      // Navigate to order detail - screen will fetch full data from API
      router.push({
        pathname: '/(admin)/don-hang/[id]',
        params: { id: notif.donHangId },
      });
    }
  };

  const renderNotifItem = ({ item }: { item: any }) => {
    const isNew = item.loai === 'don_moi';
    const statusColor = isNew ? '#22C55E' : (STATUS_COLORS[item.trangThaiMoi] || colors.blush);

    return (
      <TouchableOpacity
        style={[
          styles.notifItem,
          !item.daDoc && styles.notifItemUnread,
        ]}
        onPress={() => handleNotifPress(item)}
      >
        <View style={[styles.notifIcon, { backgroundColor: `${statusColor}15` }]}>
          <Ionicons
            name={isNew ? 'cube' : 'swap-horizontal'}
            size={18}
            color={statusColor}
          />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle} numberOfLines={1}>
            {isNew ? '📦 Đơn mới' : '🔄 Chuyển trạng thái'}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>
            {item.tenKH}
            {isNew
              ? ` · ${formatMoney(item.tongTien || 0)}`
              : ` ${item.trangThaiCu || ''} → ${item.trangThaiMoi}`
            }
          </Text>
          <Text style={styles.notifTime}>{formatRelativeTime(item.thoiGian)}</Text>
        </View>
        {!item.daDoc && <View style={styles.notifDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left: Hamburger + Brand */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => setShowDrawer(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={colors.espresso} />
        </TouchableOpacity>

        <View style={styles.brandSection}>
          <Text style={styles.brandText}>TRANG ANH</Text>
          <Text style={styles.roleBadge}>
            {isAdmin ? '👑 Admin' : `👤 ${displayName}`}
          </Text>
        </View>

        {/* Right: AI Chat + Notifications */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(admin)/ai-chat' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={20} color={colors.blush} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleBellPress}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons name="notifications-outline" size={22} color={colors.espresso} />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Drawer Menu */}
      <BottomDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* Notification Modal */}
      <Modal visible={showNotif} transparent animationType="slide" onRequestClose={() => setShowNotif(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotif(false)}>
          <View style={styles.modalOverlay} pointerEvents="none" />
        </TouchableOpacity>
        <View style={styles.modalContainer} pointerEvents={showNotif ? 'auto' : 'none'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông báo</Text>
              <View style={styles.modalActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
                    <Text style={styles.markReadText}>Đã đọc tất cả</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotif(false)}>
                  <Ionicons name="close" size={24} color={colors.stone[500]} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off" size={48} color={colors.stone[200]} />
                <Text style={styles.emptyText}>Không có thông báo</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotifItem}
                style={styles.notifList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}60`,
    minHeight: 44,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: `${colors.blush}12`,
    marginRight: 10,
  },
  brandSection: {
    flex: 1,
    gap: 0,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.espresso,
  },
  roleBadge: {
    fontSize: 10,
    color: colors.stone[400],
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: `${colors.blush}12`,
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#DC2626', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: colors.white },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 32,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.espresso },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markReadBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markReadText: { fontSize: 12, color: colors.blush, fontWeight: '600' },
  notifList: { maxHeight: SCREEN_HEIGHT * 0.55 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
  },
  notifItemUnread: { backgroundColor: `${colors.blush}08` },
  notifIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '600', color: colors.espresso, marginBottom: 4 },
  notifBody: { fontSize: 12, color: colors.stone[500], lineHeight: 18 },
  notifTime: { fontSize: 10, color: colors.stone[300], marginTop: 4 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blush, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: colors.stone[400], marginTop: 12 },
});
