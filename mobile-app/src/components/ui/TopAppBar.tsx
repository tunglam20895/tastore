import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationContext } from '@/src/hooks/useNotifications';
import { useRouter } from 'expo-router';
import NotificationDrawer from '@/src/components/admin/NotificationDrawer';

interface TopAppBarProps {
  title?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  unreadCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'Trang Anh',
  showMenu = true,
  showNotifications = true,
  showProfile = false,
  onMenuPress,
  onNotificationPress,
  onProfilePress,
  unreadCount: unreadProp,
}) => {
  const router = useRouter();
  const notifCtx = useContext(NotificationContext);
  const unreadCount = unreadProp ?? notifCtx?.unreadCount ?? 0;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showMenu && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="menu" size={24} color={colors.brandText} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {showNotifications && (
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <View style={styles.notifWrapper}>
              <MaterialIcons name="notifications" size={24} color={colors.brandText} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.profileImage}>
              <MaterialIcons name="person" size={20} color={colors['on-surface-variant']} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <NotificationDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brandBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    height: 64,
    overflow: 'visible',
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    overflow: 'visible',
  },
  notifWrapper: {
    position: 'relative',
    overflow: 'visible',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: colors.brandBg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  title: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 20,
    fontWeight: '600',
    color: colors.brandText,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors['surface-container-high'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
