import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/src/api/cai-dat";
import { getTrangThaiDH, updateTrangThaiDH } from "@/src/api/trang-thai-dh";
import { getTrangThaiKH } from "@/src/api/khach-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { DEFAULT_TRANG_THAI_DH } from "@/src/types";
import { uploadImage } from "@/src/utils/upload";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

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
  const [logoURL, setLogoURL] = useState(settings.logoURL || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Edit status color
  const [editingStatus, setEditingStatus] = useState<any | null>(null);
  const [editColor, setEditColor] = useState("");
  const [savingColor, setSavingColor] = useState(false);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ tenShop, sdt, diaChi, email });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      Alert.alert("Thành công", "Đã lưu cài đặt");
    } catch {
      Alert.alert("Lỗi", "Không thể lưu");
    }
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingLogo(true);
      try {
        const uploadResult = await uploadImage(result.assets[0].uri, "shop-assets");
        if (uploadResult.success && uploadResult.url) {
          setLogoURL(uploadResult.url);
          await updateSettings({ logoURL: uploadResult.url });
          queryClient.invalidateQueries({ queryKey: ["settings"] });
          Alert.alert("Thành công", "Đã cập nhật logo");
        } else {
          Alert.alert("Lỗi", uploadResult.error || "Không thể upload logo");
        }
      } catch {
        Alert.alert("Lỗi", "Không thể upload logo");
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const openEditColor = (tt: any) => {
    setEditingStatus(tt);
    setEditColor(tt.mau);
  };

  const handleSaveColor = async () => {
    if (!editingStatus) return;
    setSavingColor(true);
    try {
      await updateTrangThaiDH(editingStatus.key, { mau: editColor });
      queryClient.invalidateQueries({ queryKey: ["trang-thai-dh"] });
      setEditingStatus(null);
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật màu");
    } finally {
      setSavingColor(false);
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

  const presetColors = [
    '#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#22C55E', '#A8705F',
    '#DC2626', '#EC4899', '#6366F1', '#0EA5E9', '#F97316', '#84CC16',
    '#6B7280', '#1A0A04', '#C8A991', '#1E40AF',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Logo */}
      <Text style={styles.sectionTitle}>Logo</Text>
      <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} disabled={uploadingLogo}>
        {uploadingLogo ? (
          <LoadingSpinner size="md" />
        ) : logoURL ? (
          <Image source={{ uri: logoURL }} style={styles.logoPreview} contentFit="contain" />
        ) : (
          <>
            <Ionicons name="image-outline" size={40} color={colors.stone[300]} />
            <Text style={styles.logoText}>Chọn logo shop</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Shop info */}
      <Text style={styles.sectionTitle}>Thông tin shop</Text>
      <Input label="Tên shop" value={tenShop} onChangeText={setTenShop} />
      <Input label="Số điện thoại" value={sdt} onChangeText={setSdt} keyboardType="phone-pad" />
      <Input label="Địa chỉ" value={diaChi} onChangeText={setDiaChi} />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button title="LƯU THÔNG TIN" onPress={handleSaveSettings} style={styles.saveBtn} />

      {/* Order statuses */}
      <Text style={styles.sectionTitle}>Trạng thái đơn hàng (nhấn để đổi màu)</Text>
      {trangThaiDH.map((tt: any) => (
        <TouchableOpacity key={tt.key} style={styles.ttRow} onPress={() => openEditColor(tt)}>
          <View style={[styles.ttDot, { backgroundColor: tt.mau }]} />
          <Text style={styles.ttText}>{tt.ten}</Text>
          <Ionicons name="color-palette" size={16} color={colors.stone[300]} />
        </TouchableOpacity>
      ))}

      {/* Customer statuses */}
      <Text style={styles.sectionTitle}>Trạng thái khách hàng</Text>
      {trangThaiKH.map((tt: any) => (
        <View key={tt.id} style={styles.ttRow}>
          <View style={[styles.ttDot, { backgroundColor: tt.mau }]} />
          <Text style={styles.ttText}>{tt.ten}</Text>
        </View>
      ))}

      {/* Edit color modal */}
      <Modal visible={!!editingStatus} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Màu: {editingStatus?.ten}</Text>
            <View style={[styles.colorPreview, { backgroundColor: editColor }]} />
            <Input label="Mã màu HEX" value={editColor} onChangeText={(v) => setEditColor(v.startsWith('#') ? v : `#${v}`)} placeholder="#000000" />
            <Text style={styles.label}>Màu gợi ý</Text>
            <View style={styles.presetColors}>
              {presetColors.map(c => (
                <TouchableOpacity key={c} style={[styles.presetColor, { backgroundColor: c }, editColor === c && styles.presetColorSelected]}
                  onPress={() => setEditColor(c)}>
                  {editColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <Button title="Hủy" onPress={() => setEditingStatus(null)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Lưu" onPress={handleSaveColor} loading={savingColor} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.5, color: colors.stone[500], marginBottom: 12, marginTop: 16 },
  saveBtn: { marginTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerText: { fontSize: 14, color: colors.stone[400], marginTop: 16 },
  logoPicker: { height: 120, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.stone[300], justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoPreview: { width: 100, height: 100 },
  logoText: { fontSize: 12, color: colors.stone[400], marginTop: 8 },
  ttRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.stone[100] },
  ttDot: { width: 12, height: 12, borderRadius: 6 },
  ttText: { fontSize: 14, color: colors.espresso, flex: 1 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.espresso, marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
  colorPreview: { width: '100%', height: 60, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.stone[200] },
  presetColors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetColor: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  presetColorSelected: { borderColor: colors.espresso, borderWidth: 2 },
});
