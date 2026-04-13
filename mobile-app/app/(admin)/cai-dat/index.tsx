import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/src/api/cai-dat";
import { getTrangThaiDH, updateTrangThaiDH } from "@/src/api/trang-thai-dh";
import { getTrangThaiKH } from "@/src/api/khach-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { DEFAULT_TRANG_THAI_DH } from "@/src/types";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { role } = useAuthStore();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
  const settings = ((settingsData as any)?.data || settingsData || {}) as Record<string, string>;

  const { data: trangThaiDHData } = useQuery({
    queryKey: ["trang-thai-dh"],
    queryFn: () => getTrangThaiDH(),
  });
  const trangThaiDH = trangThaiDHData || DEFAULT_TRANG_THAI_DH;

  const { data: trangThaiKHData } = useQuery({
    queryKey: ["trang-thai-kh"],
    queryFn: () => getTrangThaiKH(),
  });
  const trangThaiKH = (trangThaiKHData as any)?.data || trangThaiKHData || [];

  const [tenShop, setTenShop] = useState(settings.tenShop || "");
  const [sdt, setSdt] = useState(settings.sdt || "");
  const [diaChi, setDiaChi] = useState(settings.diaChi || "");
  const [email, setEmail] = useState(settings.email || "");

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ tenShop, sdt, diaChi, email });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      Alert.alert("Thành công", "Đã lưu cài đặt");
    } catch {
      Alert.alert("Lỗi", "Không thể lưu");
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={48} color={colors.stone[300]} />
        <Text style={styles.centerText}>Chỉ Admin mới có quyền truy cập</Text>
      </View>
    );
  }

  if (loadingSettings) return <LoadingSpinner size="full" label="Đang tải..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Shop info */}
      <Text style={styles.sectionTitle}>Thông tin shop</Text>
      <Input label="Tên shop" value={tenShop} onChangeText={setTenShop} />
      <Input label="Số điện thoại" value={sdt} onChangeText={setSdt} keyboardType="phone-pad" />
      <Input label="Địa chỉ" value={diaChi} onChangeText={setDiaChi} />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button title="LƯU THÔNG TIN" onPress={handleSaveSettings} style={styles.saveBtn} />

      {/* Order statuses */}
      <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
      {trangThaiDH.map((tt: any) => (
        <OrderStatusRow key={tt.key} item={tt} />
      ))}

      {/* Customer statuses */}
      <Text style={styles.sectionTitle}>Trạng thái khách hàng</Text>
      {trangThaiKH.map((tt: any) => (
        <View key={tt.id} style={styles.ttRow}>
          <View style={[styles.ttDot, { backgroundColor: tt.mau }]} />
          <Text style={styles.ttText}>{tt.ten}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OrderStatusRow({ item }: { item: any }) {
  const [color, setColor] = useState(item.mau);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      await updateTrangThaiDH(item.key, { mau: color });
      queryClient.invalidateQueries({ queryKey: ["trang-thai-dh"] });
    } catch { /* ignore */ }
  };

  return (
    <View style={styles.ttRow}>
      <View style={[styles.ttDot, { backgroundColor: color }]} />
      <Text style={styles.ttText}>{item.ten}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.5, color: colors.stone[500], marginBottom: 12, marginTop: 16 },
  saveBtn: { marginTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerText: { fontSize: 14, color: colors.stone[400], marginTop: 16 },
  ttRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.stone[100] },
  ttDot: { width: 12, height: 12, borderRadius: 6 },
  ttText: { fontSize: 14, color: colors.espresso },
});
