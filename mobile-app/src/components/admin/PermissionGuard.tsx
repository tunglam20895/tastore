import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Component bọc các màn hình admin để kiểm tra quyền staff.
 * Nếu staff không có quyền, hiển thị màn hình "Không có quyền".
 */
export function withPermission(WrappedComponent: React.ComponentType<any>, requiredQuyen: string | null = null) {
  return function PermissionGuard(props: any) {
    const { role, staffQuyen } = useAuthStore();
    const isAdmin = role === 'admin';
    const hasAccess = isAdmin || (requiredQuyen ? staffQuyen.includes(requiredQuyen) : true);

    if (!hasAccess) {
      return (
        <View style={styles.container}>
          <Ionicons name="lock-closed" size={48} color={colors.stone[300]} />
          <Text style={styles.title}>Không có quyền truy cập</Text>
          <Text style={styles.subtitle}>Tài khoản của bạn không có quyền sử dụng tính năng này.</Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '600', color: colors.espresso, marginTop: 16 },
  subtitle: { fontSize: 14, color: colors.stone[400], textAlign: 'center', marginTop: 8 },
});
