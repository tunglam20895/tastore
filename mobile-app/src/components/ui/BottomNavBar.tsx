import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface NavItem {
  name: string;
  icon: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    icon: 'dashboard',
    route: '/(admin)/dashboard',
  },
  {
    name: 'Đơn hàng',
    icon: 'receipt-long',
    route: '/(admin)/don-hang',
  },
  {
    name: 'Sản phẩm',
    icon: 'checkroom',
    route: '/(admin)/san-pham',
  },
  {
    name: 'Khách hàng',
    icon: 'group',
    route: '/(admin)/khach-hang',
  },
  {
    name: 'Cài đặt',
    icon: 'settings',
    route: '/(admin)/more',
  },
];

export const BottomNavBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    return pathname.includes(route.replace('/(admin)', ''));
  };

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={active ? colors.brandText : colors['on-surface-variant']}
            />
            <Text
              style={[
                styles.navLabel,
                active && styles.navLabelActive,
              ]}
            >
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
