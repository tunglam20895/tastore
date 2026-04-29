import React, { useState } from "react";
import AdminDetailHeader from "@/src/components/admin/AdminDetailHeader";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { createProduct, getCategories, generateMoTa } from "@/src/api/san-pham";
import { uploadImage } from "@/src/utils/upload";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";
import { colors } from "@/src/theme";
import { legacyColors } from "@/src/theme/legacy-colors";
import { QUICK_SIZES } from "@/src/utils/constants";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

type SizeEntry = { ten: string; soLuong: number };

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ten, setTen] = useState("");
  const [giaGoc, setGiaGoc] = useState("");
  const [phanTramGiam, setPhanTramGiam] = useState("");
  const [moTa, setMoTa] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [conHang, setConHang] = useState(true);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [anhUri, setAnhUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const categories = (categoriesData as any)?.data || categoriesData || [];

  const toggleSize = (sizeName: string) => {
    setSizes(prev => {
      const exists = prev.find(s => s.ten === sizeName);
      if (exists) return prev.filter(s => s.ten !== sizeName);
      return [...prev, { ten: sizeName, soLuong: 0 }];
    });
  };

  const updateSizeQty = (sizeName: string, qty: string) => {
    setSizes(prev => prev.map(s => s.ten === sizeName ? { ...s, soLuong: parseInt(qty) || 0 } : s));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAnhUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError("Cần cấp quyền camera");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAnhUri(result.assets[0].uri);
    }
  };

  const handleGenerate = async () => {
    if (!ten) { showError("Nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await generateMoTa(ten, parseFloat(giaGoc) || 0, danhMuc);
      if (res.success) setMoTa(res.data?.moTa || res.data || res.moTa || "");
    } catch { showError("Không thể tạo mô tả"); }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!ten || !giaGoc) { showError("Điền đủ tên và giá"); return; }

    setSaving(true);
    try {
      let anhURL = "";

      // Upload ảnh nếu có
      if (anhUri) {
        setUploading(true);
        const uploadResult = await uploadImage(anhUri);
        setUploading(false);
        if (uploadResult.success && uploadResult.url) {
          anhURL = uploadResult.url;
        } else {
          showError(uploadResult.error || "Không thể upload ảnh");
          setSaving(false);
          return;
        }
      }

      const productData: Record<string, unknown> = {
        ten,
        gia_goc: parseFloat(giaGoc),
        phan_tram_giam: phanTramGiam ? parseFloat(phanTramGiam) : null,
        mo_ta: moTa,
        danh_muc: danhMuc,
        con_hang: conHang,
        so_luong: sizes.length > 0 ? sizes.reduce((sum, s) => sum + s.soLuong, 0) : 0,
        sizes: sizes.length > 0 ? sizes : [],
        anh_url: anhURL,
      };

      await createProduct(productData);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showSuccess("Đã thêm sản phẩm");
      setTimeout(() => router.back(), 1000);
    } catch {
      showError("Không thể thêm sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <AdminDetailHeader title="Thêm sản phẩm mới" showNotification />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {anhUri ? (
            <Image source={{ uri: anhUri }} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={legacyColors.stone[400]} />
              <Text style={styles.imageText}>Chọn ảnh sản phẩm</Text>
            </>
          )}
          {/* Camera icon overlay */}
          <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={18} color={legacyColors.cream} />
          </TouchableOpacity>
          {anhUri && (
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setAnhUri(null)}>
              <Ionicons name="close" size={18} color={legacyColors.cream} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {uploading && (
          <View style={styles.uploadingRow}>
            <LoadingSpinner size="sm" />
            <Text style={styles.uploadingText}>Đang upload ảnh...</Text>
          </View>
        )}

        <Input label="Tên sản phẩm" value={ten} onChangeText={setTen} placeholder="Nhập tên sản phẩm" />
        <Input label="Giá gốc (VNĐ)" value={giaGoc} onChangeText={setGiaGoc} keyboardType="numeric" placeholder="VD: 500000" />
        <Input label="% Giảm giá" value={phanTramGiam} onChangeText={setPhanTramGiam} keyboardType="numeric" placeholder="VD: 20" />

        {/* Categories */}
        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.filterChips}>
          <TouchableOpacity style={[styles.chip, !danhMuc && styles.chipActive]} onPress={() => setDanhMuc("")}>
            <Text style={[styles.chipText, !danhMuc && styles.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, danhMuc === c.id && styles.chipActive]}
              onPress={() => setDanhMuc(c.id)}>
              <Text style={[styles.chipText, danhMuc === c.id && styles.chipTextActive]}>{c.tenDanhMuc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sizes */}
        <Text style={styles.label}>Sizes</Text>
        <View style={styles.filterChips}>
          {QUICK_SIZES.map(s => {
            const active = sizes.find(sz => sz.ten === s);
            return (
              <TouchableOpacity key={s} style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleSize(s)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sizes.length > 0 && (
          <View style={styles.sizeQtySection}>
            {sizes.map(s => (
              <View key={s.ten} style={styles.sizeQtyRow}>
                <Text style={styles.sizeQtyLabel}>{s.ten}</Text>
                <Input
                  value={s.soLuong.toString()}
                  onChangeText={(v) => updateSizeQty(s.ten, v)}
                  keyboardType="numeric"
                  style={{ flex: 1, marginBottom: 0 }}
                  inputStyle={{ paddingVertical: 6 }}
                />
              </View>
            ))}
          </View>
        )}

        {/* Description + AI */}
        <View style={styles.moTaHeader}>
          <Text style={styles.label}>Mô tả</Text>
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={styles.aiBtn}>
            <Ionicons name="sparkles" size={18} color={generating ? legacyColors.stone[300] : legacyColors.blush} />
            <Text style={[styles.aiText, generating && { color: legacyColors.stone[300] }]}>

              {generating ? "Đang tạo..." : "AI tạo"}
            </Text>
          </TouchableOpacity>
        </View>
        <Input value={moTa} onChangeText={setMoTa} placeholder="Mô tả sản phẩm..." multiline numberOfLines={6} />

        {/* Con hang */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Còn hàng</Text>
          <Switch value={conHang} onValueChange={setConHang} />
        </View>

        <Button title="LƯU SẢN PHẨM" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: legacyColors.cream },
  scroll: { padding: 16 },
  imagePicker: { height: 220, backgroundColor: legacyColors.white, borderRadius: 12, borderWidth: 1, borderColor: legacyColors.stone[300], justifyContent: "center", alignItems: "center", marginBottom: 16, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imageText: { fontSize: 12, color: legacyColors.stone[400], marginTop: 8 },
  cameraBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: legacyColors.espresso, justifyContent: 'center', alignItems: 'center' },
  removeImageBtn: { position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: legacyColors.rose, justifyContent: 'center', alignItems: 'center' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  uploadingText: { fontSize: 12, color: legacyColors.stone[400] },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: legacyColors.stone[600], marginBottom: 6 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: legacyColors.stone[300], backgroundColor: legacyColors.white },
  chipActive: { backgroundColor: legacyColors.espresso, borderColor: legacyColors.espresso },
  chipText: { fontSize: 11, color: legacyColors.stone[500] },
  chipTextActive: { color: legacyColors.cream },
  sizeQtySection: { marginBottom: 16 },
  sizeQtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  sizeQtyLabel: { fontSize: 14, fontWeight: "600", color: legacyColors.espresso, width: 40 },
  moTaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  aiText: { fontSize: 11, color: legacyColors.blush, fontWeight: '600' },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  saveBtn: { marginBottom: 32 },
});
