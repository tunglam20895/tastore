import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "@/src/api/auth";

const menuItems = [
  { icon: "people", label: "Khách hàng", route: "/(admin)/khach-hang", quyen: "khach-hang" },
  { icon: "pricetags", label: "Mã giảm giá", route: "/(admin)/ma-giam-gia", quyen: "ma-giam-gia" },
  { icon: "people", label: "Nhân viên", route: "/(admin)/nhan-vien", quyen: null },
  { icon: "settings", label: "Cài đặt", route: "/(admin)/cai-dat", quyen: null },
];

export default function MoreScreen() {
  const router = useRouter();
  const { role, staffQuyen, logout: logoutStore } = useAuthStore();
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
            <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.divider} />

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
        <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color="#DC2626" />
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
  logoutText: { fontSize: 16, color: "#DC2626", fontWeight: "600" },
});
