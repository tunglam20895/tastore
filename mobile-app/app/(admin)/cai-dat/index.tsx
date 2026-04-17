import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/src/api/cai-dat";
import { getTrangThaiDH, updateTrangThaiDH } from "@/src/api/trang-thai-dh";
import { getTrangThaiKH } from "@/src/api/khach-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors, shadows, borderRadius } from "@/src/theme";
import { DEFAULT_TRANG_THAI_DH } from "@/src/types";
import { uploadImage } from "@/src/utils/upload";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";

export default function SettingsScreen() {
  const { role } = useAuthStore();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });

  const { data: trangThaiDHData, isLoading: loadingTrangThaiDH } = useQuery({
    queryKey: ["trang-thai-dh"],
    queryFn: () => getTrangThaiDH(),
  });

  const { data: trangThaiKHData, isLoading: loadingTrangThaiKH } = useQuery({
    queryKey: ["trang-thai-kh"],
    queryFn: () => getTrangThaiKH(),
  });

  // Safe data extraction with type casting
  const rawSettings = (settingsData as any)?.data || settingsData || {};
  const safeSettings = (typeof rawSettings === 'object' ? rawSettings : {}) as Record<string, string>;

  const rawTrangThaiDH = trangThaiDHData as any;
  const trangThaiDH: any[] = Array.isArray(rawTrangThaiDH)
    ? rawTrangThaiDH
    : (rawTrangThaiDH?.data && Array.isArray(rawTrangThaiDH.data))
      ? rawTrangThaiDH.data
      : DEFAULT_TRANG_THAI_DH;

  const rawTrangThaiKH = trangThaiKHData as any;
  const trangThaiKH: any[] = Array.isArray(rawTrangThaiKH)
    ? rawTrangThaiKH
    : (rawTrangThaiKH?.data && Array.isArray(rawTrangThaiKH.data))
      ? rawTrangThaiKH.data
      : [];

  const [tenShop, setTenShop] = useState(safeSettings.tenShop || "");
  const [sdt, setSdt] = useState(safeSettings.sdt || "");
  const [diaChi, setDiaChi] = useState(safeSettings.diaChi || "");
  const [email, setEmail] = useState(safeSettings.email || "");
  const [logoURL, setLogoURL] = useState(safeSettings.logoURL || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Sync state when data loads
  useEffect(() => {
    if (settingsData && !loadingSettings) {
      const s = safeSettings;
      setTenShop(s.tenShop || "");
      setSdt(s.sdt || "");
      setDiaChi(s.diaChi || "");
      setEmail(s.email || "");
      setLogoURL(s.logoURL || "");
    }
  }, [settingsData]);

  // Edit status color
  const [editingStatus, setEditingStatus] = useState<any | null>(null);
  const [editColor, setEditColor] = useState("");
  const [savingColor, setSavingColor] = useState(false);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ tenShop, sdt, diaChi, email });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showSuccess("Đã lưu cài đặt");
    } catch {
      showError("Không thể lưu");
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
          showSuccess("Đã cập nhật logo");
        } else {
          showError(uploadResult.error || "Không thể upload logo");
        }
      } catch {
        showError("Không thể upload logo");
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const openEditColor = (tt: any) => {
    setEditingStatus(tt);
    setEditColor(tt?.mau || "#000000");
  };

  const handleSaveColor = async () => {
    if (!editingStatus) return;
    setSavingColor(true);
    try {
      await updateTrangThaiDH(editingStatus.key, { mau: editColor });
      queryClient.invalidateQueries({ queryKey: ["trang-thai-dh"] });
      setEditingStatus(null);
    } catch {
      showError("Không thể cập nhật màu");
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

  if (loadingSettings || loadingTrangThaiDH) {
    return <LoadingSpinner size="full" label="Đang tải cài đặt..." />;
  }

  const presetColors = [
    colors.info, '#8B5CF6', '#14B8A6', '#F59E0B', '#22C55E', '#A8705F',
    colors.danger, '#EC4899', '#6366F1', '#0EA5E9', '#F97316', '#84CC16',
    '#6B7280', '#1A0A04', '#C8A991', '#1E40AF',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <Text style={styles.sectionTitle}>Logo shop</Text>
      <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} disabled={uploadingLogo} activeOpacity={0.7}>
        {uploadingLogo ? (
          <LoadingSpinner size="md" />
        ) : logoURL ? (
          <Image source={{ uri: logoURL }} style={styles.logoPreview} contentFit="contain" />
        ) : (
          <>
            <Ionicons name="image-outline" size={40} color={colors.stone[300]} />
            <Text style={styles.logoText}>Nhấn để chọn logo</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Shop info */}
      <Text style={styles.sectionTitle}>Thông tin shop</Text>
      <Input label="Tên shop" value={tenShop} onChangeText={setTenShop} />
      <Input label="Số điện thoại" value={sdt} onChangeText={setSdt} keyboardType="phone-pad" />
      <Input label="Địa chỉ" value={diaChi} onChangeText={setDiaChi} />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button title="💾 Lưu thông tin" onPress={handleSaveSettings} style={styles.saveBtn} />

      {/* Order statuses */}
      <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
      {trangThaiDH.map((tt: any) => (
        <TouchableOpacity
          key={tt.key}
          style={styles.ttRow}
          onPress={() => openEditColor(tt)}
          activeOpacity={0.7}
        >
          <View style={[styles.ttDot, { backgroundColor: tt.mau || colors.stone[300] }]} />
          <Text style={styles.ttText}>{tt.ten}</Text>
          <Ionicons name="color-palette-outline" size={16} color={colors.stone[400]} />
        </TouchableOpacity>
      ))}

      {/* Customer statuses */}
      {trangThaiKH.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Trạng thái khách hàng</Text>
          {trangThaiKH.map((tt: any) => (
            <View key={tt.id} style={styles.ttRow}>
              <View style={[styles.ttDot, { backgroundColor: tt.mau || colors.stone[300] }]} />
              <Text style={styles.ttText}>{tt.ten}</Text>
            </View>
          ))}
        </>
      )}

      {/* Edit color modal */}
      <Modal visible={!!editingStatus} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditingStatus(null)}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Đổi màu: {editingStatus?.ten || ''}
                </Text>
                <View style={[styles.colorPreview, { backgroundColor: editColor }]} />
                <Input
                  label="Mã màu HEX"
                  value={editColor}
                  onChangeText={(v) => setEditColor(v.startsWith('#') ? v : `#${v}`)}
                  placeholder="#000000"
                />
                <Text style={styles.presetLabel}>Màu gợi ý</Text>
                <View style={styles.presetColors}>
                  {presetColors.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.presetColor, { backgroundColor: c }, editColor === c && styles.presetColorSelected]}
                      onPress={() => setEditColor(c)}
                    >
                      {editColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <Button title="Hủy" onPress={() => setEditingStatus(null)} variant="ghost" style={{ flex: 1 }} />
                  <Button title="Lưu" onPress={handleSaveColor} loading={savingColor} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.espresso,
    marginBottom: 12,
    marginTop: 20,
  },
  saveBtn: { marginTop: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerText: { fontSize: 14, color: colors.stone[400], marginTop: 16 },
  logoPicker: {
    height: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...shadows.card,
  },
  logoPreview: { width: 100, height: 100 },
  logoText: { fontSize: 12, color: colors.stone[400], marginTop: 8 },
  ttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.stone[100],
  },
  ttDot: { width: 12, height: 12, borderRadius: 6 },
  ttText: { fontSize: 14, color: colors.espresso, flex: 1, fontWeight: '500' },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.stone[600],
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    ...shadows.card,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.espresso,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
  colorPreview: {
    width: '100%',
    height: 60,
    borderRadius: borderRadius.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.stone[600],
    marginBottom: 8,
  },
  presetColors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetColor: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetColorSelected: { borderColor: colors.espresso, borderWidth: 2 },
});
