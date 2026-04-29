import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NotificationContext } from '@/src/hooks/useNotifications';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme';
import { legacyColors } from '@/src/theme/legacy-colors';
import { formatMoney } from '@/src/utils/format';
import type { OrderNotif } from '@/src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.85, 400);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const getIcon = (loai: string): React.ComponentProps<typeof Ionicons>['name'] => {
  switch (loai) {
    case 'don_moi': return 'bag-add-outline';
    case 'chuyen_trang_thai': return 'swap-horizontal-outline';
    default: return 'notifications-outline';
  }
};

const getIconColor = (loai: string) => {
  switch (loai) {
    case 'don_moi': return '#22C55E';
    case 'chuyen_trang_thai': return '#F59E0B';
    default: return colors.primary;
  }
};

const formatTimeAgo = (thoiGian: string) => {
  if (!thoiGian) return '—';
  const now = new Date();
  const past = new Date(thoiGian);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

const getTitle = (item: OrderNotif) => {
  if (item.loai === 'don_moi') return `Đơn hàng mới từ ${item.tenKH}`;
  if (item.loai === 'chuyen_trang_thai') return `Cập nhật đơn #${item.donHangId}`;
  return 'Thông báo';
};

const getSubtitle = (item: OrderNotif) => {
  if (item.loai === 'don_moi') {
    const parts = [item.tenSP];
    if (item.tongTien) parts.push(formatMoney(item.tongTien));
    return parts.filter(Boolean).join(' · ');
  }
  if (item.loai === 'chuyen_trang_thai') {
    const parts = [];
    if (item.trangThaiCu) parts.push(`${item.trangThaiCu} → ${item.trangThaiMoi}`);
    else parts.push(item.trangThaiMoi);
    if (item.nguoiXuLy) parts.push(item.nguoiXuLy);
    return parts.join(' · ');
  }
  return '';
};

export default function NotificationDrawer({ visible, onClose }: Props) {
  const router = useRouter();
  const notifCtx = useContext(NotificationContext);
  const notifications = notifCtx?.notifications ?? [];
  const unreadCount = notifCtx?.unreadCount ?? 0;

  const handleItemPress = (item: OrderNotif) => {
    if (!item.daDoc) notifCtx?.markSingleRead(item.id);
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/(admin)/don-hang/[id]' as any,
        params: { id: item.donHangId },
      });
    }, 200);
  };

  const handleMarkAllRead = () => {
    notifCtx?.markAllRead();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Drawer panel */}
      <View style={styles.drawer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <Text style={styles.headerTitle}>Thông báo</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={handleMarkAllRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done-outline" size={16} color={colors.secondary} />
                <Text style={styles.markAllText}>Đọc tất cả</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* List */}
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {notifications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={legacyColors.stone[300]} />
              <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.item, !item.daDoc && styles.itemUnread]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.75}
              >
                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: `${getIconColor(item.loai)}18` }]}>
                  <Ionicons name={getIcon(item.loai)} size={20} color={getIconColor(item.loai)} />
                </View>

                {/* Content */}
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, !item.daDoc && styles.itemTitleUnread]} numberOfLines={1}>
                    {getTitle(item)}
                  </Text>
                  <Text style={styles.itemSub} numberOfLines={2}>
                    {getSubtitle(item)}
                  </Text>
                  <Text style={styles.itemTime}>{formatTimeAgo(item.thoiGian)}</Text>
                </View>

                {/* Unread dot */}
                {!item.daDoc && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_W,
    backgroundColor: colors['surface-container-lowest'],
    ...shadows.floating,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors['surface-container-low'],
  },
  markAllText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors['outline-variant'],
    marginHorizontal: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: legacyColors.stone[300],
    fontFamily: typography.fontFamily.body,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors['outline-variant'],
  },
  itemUnread: {
    backgroundColor: `${colors.primary}06`,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors['on-surface'],
    fontFamily: typography.fontFamily.body,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: colors.primary,
  },
  itemSub: {
    fontSize: 12,
    color: colors['on-surface-variant'],
    fontFamily: typography.fontFamily.body,
  },
  itemTime: {
    fontSize: 11,
    color: legacyColors.stone[300],
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginTop: 6,
    flexShrink: 0,
  },
});
