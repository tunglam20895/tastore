import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { NotificationContext } from "@/src/hooks/useNotifications";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "@/src/api/auth";

const menuItems = [
  { icon: "people", label: "Khách hàng", route: "/(admin)/khach-hang", quyen: "khach-hang" },
  { icon: "pricetags", label: "Mã giảm giá", route: "/(admin)/ma-giam-gia", quyen: "ma-giam-gia" },
  { icon: "people", label: "Nhân viên", route: "/(admin)/nhan-vien", quyen: null },
  { icon: "settings", label: "Cài đặt", route: "/(admin)/cai-dat", quyen: null },
  { icon: "sparkles", label: "Trợ lý AI", route: "/(admin)/ai-chat", quyen: "dashboard" },
];

export default function MoreScreen() {
  const router = useRouter();
  const { role, staffQuyen, logout: logoutStore } = useAuthStore();
  const notifCtx = useContext(NotificationContext);
  const unreadCount = notifCtx?.unreadCount ?? 0;
  const isAdmin = role === "admin";

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    await logoutStore();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thêm</Text>
      {menuItems.map(item => {
        if (item.quyen && !isAdmin && !staffQuyen.includes(item.quyen)) return null;
        return (
          <TouchableOpacity key={item.label} style={styles.menuItem}
            onPress={() => router.push(item.route as any)}>
            <Ionicons name={item.icon as any} size={22} color={colors.espresso} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.label === "Trợ lý AI" && (
              <Ionicons name="sparkles" size={16} color={colors.blush} />
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.divider} />

      {/* Navigation to main tabs */}
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(admin)/dashboard")}>
        <Ionicons name="stats-chart" size={22} color={colors.espresso} />
        <Text style={styles.menuLabel}>Dashboard</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(admin)/san-pham")}>
        <Ionicons name="shirt" size={22} color={colors.espresso} />
        <Text style={styles.menuLabel}>Sản phẩm</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(admin)/don-hang")}>
        <Ionicons name="receipt" size={22} color={colors.espresso} />
        <Text style={styles.menuLabel}>Đơn hàng</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  title: { fontSize: 20, fontWeight: "300", letterSpacing: 2, color: colors.espresso, padding: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  menuLabel: { flex: 1, fontSize: 16, color: colors.espresso },
  divider: { height: 12, backgroundColor: colors.cream },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 16 },
  logoutText: { fontSize: 16, color: colors.danger, fontWeight: "600" },
  badge: { backgroundColor: colors.danger, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
});
