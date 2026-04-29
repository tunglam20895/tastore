import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  quyen?: string; // undefined = tất cả đều xem được, string = cần quyền này
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    icon: 'dashboard',
    route: '/(admin)/dashboard',
    quyen: 'dashboard',
  },
  {
    name: 'Đơn hàng',
    icon: 'receipt-long',
    route: '/(admin)/don-hang',
    quyen: 'don-hang',
  },
  {
    name: 'Sản phẩm',
    icon: 'checkroom',
    route: '/(admin)/san-pham',
    quyen: 'san-pham',
  },
  {
    name: 'Khách hàng',
    icon: 'group',
    route: '/(admin)/khach-hang',
    quyen: 'khach-hang',
  },
  {
    name: 'Cài đặt',
    icon: 'settings',
    route: '/(admin)/more',
    // more/index accessible to all (nội dung bên trong mới check)
  },
];

export const BottomNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { role, staffQuyen } = useAuthStore();

  // Lọc nav items theo quyền
  const navItems = useMemo(() => {
    if (role === 'admin') return ALL_NAV_ITEMS; // Admin thấy tất cả

    return ALL_NAV_ITEMS.filter((item) => {
      if (!item.quyen) return true; // Không cần quyền → hiện
      if (item.adminOnly) return false; // Admin only → ẩn với staff
      return staffQuyen.includes(item.quyen); // Có quyền → hiện
    });
  }, [role, staffQuyen]);

  const isActive = (route: string) => {
    return pathname.includes(route.replace('/(admin)', ''));
  };

  const handlePress = (item: NavItem) => {
    // Double-check quyền trước khi navigate
    if (role === 'staff' && item.quyen && !staffQuyen.includes(item.quyen)) return;
    router.push(item.route as any);
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={active ? colors.brandText : colors['on-surface-variant']}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    backgroundColor: colors['surface-container-lowest'],
    borderTopWidth: 1,
    borderTopColor: colors['outline-variant'],
    height: 80,
    ...shadows.navbar,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.xl,
    minWidth: 60,
  },
  navItemActive: {
    backgroundColor: colors['surface-container'],
    transform: [{ translateY: -2 }],
  },
  navLabel: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 10,
    fontWeight: '400',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  navLabelActive: {
    fontWeight: '600',
    color: colors.brandText,
  },
});
