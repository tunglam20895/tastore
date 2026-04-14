import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  Dimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme';
import { formatMoney, formatRelativeTime } from '@/src/utils/format';
import { STATUS_COLORS } from '@/src/utils/constants';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AdminHeader() {
  const router = useRouter();
  const { role, staffTen } = useAuthStore();
  const { notifications, unreadCount, markAllRead, markSingleRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
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
      router.push({ pathname: '/(admin)/don-hang/[id]', params: { id: notif.donHangId } });
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
    <>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.shopName}>TRANG ANH STORE</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <View style={styles.rightSection}>
          {/* AI Chat button */}
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/(admin)/ai-chat' as any)}
          >
            <Ionicons name="sparkles" size={20} color={colors.blush} />
          </TouchableOpacity>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellBtn} onPress={handleBellPress}>
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

      {/* Notification Modal */}
      <Modal visible={showNotif} transparent animationType="slide" onRequestClose={() => setShowNotif(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông báo</Text>
              <View style={styles.modalActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
                    <Text style={styles.markReadText}>Đánh dấu đã đọc</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
  },
  leftSection: { gap: 2 },
  shopName: { fontSize: 12, fontWeight: '600', letterSpacing: 2, color: colors.espresso },
  userName: { fontSize: 10, color: colors.stone[400] },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatBtn: { padding: 4 },
  bellBtn: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#DC2626', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7, paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.stone[200],
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.espresso },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markReadBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markReadText: { fontSize: 12, color: colors.blush, fontWeight: '600' },
  notifList: { maxHeight: SCREEN_HEIGHT * 0.55 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.stone[100],
  },
  notifItemUnread: { backgroundColor: `${colors.blush}08` },
  notifIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: colors.espresso, marginBottom: 4 },
  notifBody: { fontSize: 12, color: colors.stone[500], lineHeight: 18 },
  notifTime: { fontSize: 10, color: colors.stone[300], marginTop: 4 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blush, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: colors.stone[400], marginTop: 12 },
});
