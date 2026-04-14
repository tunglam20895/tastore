import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProduct, updateProduct, deleteProduct, getCategories, generateMoTa } from "@/src/api/san-pham";
import { uploadImage } from "@/src/utils/upload";
import { colors } from "@/src/theme";
import { QUICK_SIZES } from "@/src/utils/constants";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

type SizeEntry = { ten: string; soLuong: number };

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const categories = (categoriesData as any)?.data || categoriesData || [];

  const [ten, setTen] = useState(data?.ten || "");
  const [giaGoc, setGiaGoc] = useState(data?.giaGoc?.toString() || "");
  const [phanTramGiam, setPhanTramGiam] = useState(data?.phanTramGiam?.toString() || "");
  const [moTa, setMoTa] = useState(data?.moTa || "");
  const [danhMuc, setDanhMuc] = useState(data?.danhMuc || "");
  const [conHang, setConHang] = useState(data?.conHang ?? true);
  const [sizes, setSizes] = useState<SizeEntry[]>(data?.sizes || []);
  const [anhUri, setAnhUri] = useState<string | null>(data?.anhURL || null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setTen(data.ten);
      setGiaGoc(data.giaGoc?.toString() || "");
      setPhanTramGiam(data.phanTramGiam?.toString() || "");
      setMoTa(data.moTa || "");
      setDanhMuc(data.danhMuc || "");
      setConHang(data.conHang ?? true);
      setSizes(data.sizes || []);
      setAnhUri(data.anhURL || null);
      setNewImageUri(null);
    }
  }, [data]);

  const toggleSize = (sizeName: string) => {
    setSizes(prev => {
      const exists = prev.find(s => s.ten === sizeName);
      if (exists) return prev.filter(s => s.ten !== sizeName);
      return [...prev, { ten: sizeName, soLuong: 0 }];
    });
  };

  const updateSizeQty = (sizeName: string, qty: number) => {
    setSizes(prev => prev.map(s => s.ten === sizeName ? { ...s, soLuong: qty } : s));
  };

  const pickImage = async () => {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleGenerate = async () => {
    if (!ten) { Alert.alert("Lỗi", "Nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await generateMoTa(ten, parseFloat(giaGoc) || 0, danhMuc);
      if (res.success) setMoTa(res.data?.moTa || res.data || res.moTa || "");
    } catch { Alert.alert("Lỗi", "Không thể tạo mô tả"); }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!ten || !giaGoc) { Alert.alert("Lỗi", "Điền đủ tên và giá"); return; }
    setSaving(true);
    try {
      let anhURL = data?.anhURL || "";

      // Upload ảnh mới nếu có
      if (newImageUri) {
        setUploading(true);
        const uploadResult = await uploadImage(newImageUri);
        setUploading(false);
        if (uploadResult.success && uploadResult.url) {
          anhURL = uploadResult.url;
        } else {
          Alert.alert("Lỗi upload", uploadResult.error || "Không thể upload ảnh");
          setSaving(false);
          return;
        }
      }

      await updateProduct(id!, {
        ten,
        gia_goc: parseFloat(giaGoc),
        phan_tram_giam: phanTramGiam ? parseFloat(phanTramGiam) : null,
        mo_ta: moTa,
        danh_muc: danhMuc,
        con_hang: conHang,
        so_luong: sizes.length > 0 ? sizes.reduce((sum, s) => sum + s.soLuong, 0) : (data?.soLuong || 0),
        sizes: sizes.length > 0 ? sizes : [],
        anh_url: anhURL,
      });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Thành công", "Đã cập nhật sản phẩm");
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(id!);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Thành công", "Đã xóa sản phẩm");
      router.replace("/(admin)/san-pham");
    } catch {
      Alert.alert("Lỗi", "Không thể xóa");
    }
  };

  if (isLoading) {
    return <View style={styles.center}><LoadingSpinner size="lg" label="Đang tải..." /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image section */}
        <View style={styles.imageSection}>
          {newImageUri ? (
            <Image source={{ uri: newImageUri }} style={styles.image} contentFit="cover" />
          ) : anhUri ? (
            <Image source={{ uri: anhUri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={48} color={colors.stone[300]} />
              <Text style={styles.noImageText}>Chưa có ảnh</Text>
            </View>
          )}
          <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
            <Ionicons name="camera" size={16} color={colors.cream} />
            <Text style={styles.changeImageText}>Đổi ảnh</Text>
          </TouchableOpacity>
        </View>
        {uploading && (
          <View style={styles.uploadingRow}>
            <LoadingSpinner size="sm" />
            <Text style={styles.uploadingText}>Đang upload ảnh...</Text>
          </View>
        )}

        <Input label="Tên sản phẩm" value={ten} onChangeText={setTen} />
        <Input label="Giá gốc (VNĐ)" value={giaGoc} onChangeText={setGiaGoc} keyboardType="numeric" />
        <Input label="% Giảm giá" value={phanTramGiam} onChangeText={setPhanTramGiam} keyboardType="numeric" />

        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.filterChips}>
          <TouchableOpacity style={[styles.chip, !danhMuc && styles.chipActive]} onPress={() => setDanhMuc("")}>
            <Text style={[styles.chipText, !danhMuc && styles.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, danhMuc === c.id && styles.chipActive]} onPress={() => setDanhMuc(c.id)}>
              <Text style={[styles.chipText, danhMuc === c.id && styles.chipTextActive]}>{c.tenDanhMuc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Sizes</Text>
        <View style={styles.filterChips}>
          {QUICK_SIZES.map(s => {
            const active = sizes.find(sz => sz.ten === s);
            return (
              <TouchableOpacity key={s} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleSize(s)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {sizes.length > 0 && sizes.map(s => (
          <View key={s.ten} style={styles.sizeRow}>
            <Text style={styles.sizeLabel}>{s.ten}</Text>
            <Input value={s.soLuong.toString()} onChangeText={(v) => updateSizeQty(s.ten, parseInt(v) || 0)} keyboardType="numeric" style={{ flex: 1, marginBottom: 0 }} inputStyle={{ paddingVertical: 6 }} />
          </View>
        ))}

        {/* Description + AI */}
        <View style={styles.moTaHeader}>
          <Text style={styles.label}>Mô tả</Text>
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={styles.aiBtn}>
            <Ionicons name="sparkles" size={18} color={generating ? colors.stone[300] : colors.blush} />
            <Text style={[styles.aiText, generating && { color: colors.stone[300] }]}>
              {generating ? "Đang tạo..." : "AI tạo"}
            </Text>
          </TouchableOpacity>
        </View>
        <Input value={moTa} onChangeText={setMoTa} multiline numberOfLines={6} />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Còn hàng</Text>
          <Switch value={conHang} onValueChange={setConHang} />
        </View>

        <Button title="CẬP NHẬT" onPress={handleSave} loading={saving} style={styles.saveBtn} />
        <Button title="XÓA SẢN PHẨM" onPress={() => setConfirmDelete(true)} variant="danger" />
      </ScrollView>

      <ConfirmDialog visible={confirmDelete} title="Xóa sản phẩm?" message="Hành động này không thể hoàn tác." confirmText="Xóa" isDanger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageSection: { marginBottom: 16, alignItems: 'center' },
  image: { width: '100%', height: 220, borderRadius: 12 },
  noImage: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.stone[300], justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 12, color: colors.stone[400], marginTop: 8 },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.espresso, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  changeImageText: { fontSize: 12, color: colors.cream, fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  uploadingText: { fontSize: 12, color: colors.stone[400] },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 11, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  sizeLabel: { fontSize: 14, fontWeight: "600", color: colors.espresso, width: 40 },
  moTaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  aiText: { fontSize: 11, color: colors.blush, fontWeight: '600' },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  saveBtn: { marginBottom: 12 },
});
