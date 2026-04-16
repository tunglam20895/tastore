import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { updateProduct, deleteProduct, getCategories, generateMoTa } from "@/src/api/san-pham";
import { uploadImage } from "@/src/utils/upload";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";
import { colors, shadows, borderRadius } from "@/src/theme";
import { QUICK_SIZES } from "@/src/utils/constants";
import { formatMoney } from "@/src/utils/format";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import AdminDetailHeader from "@/src/components/admin/AdminDetailHeader";
import { Ionicons } from "@expo/vector-icons";

type SizeEntry = { ten: string; soLuong: number };

export default function EditProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; cachedData?: string }>();
  const id = params?.id || "";

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Try to get cached data from list first (fast, no extra API call)
  const cached = params.cachedData ? (() => {
    try { 
      return JSON.parse(params.cachedData); 
    } catch { 
      return null; 
    }
  })() : null;
  const cachedProduct = cached ? { data: cached, isLoading: false } : undefined;

  // Only call API if no cached data
  const { data, isLoading } = cachedProduct || {
    data: undefined,
    isLoading: false,
  };

  const { data: categoriesData } = useQueryClient().getQueryData<{ data: any[] }>(["categories"]) || { data: [] };
  const categories = categoriesData || [];

  const [ten, setTen] = useState(data?.ten || "");
  const [giaGoc, setGiaGoc] = useState(data?.giaGoc?.toString() || "");
  const [phanTramGiam, setPhanTramGiam] = useState(data?.phanTramGiam?.toString() || "");
  const [moTa, setMoTa] = useState(data?.moTa || "");
  const [danhMuc, setDanhMuc] = useState(data?.danhMuc || "");
  const [conHang, setConHang] = useState(data?.conHang ?? true);
  const [sizes, setSizes] = useState<SizeEntry[]>(data?.sizes || []);
  const [anhUri, setAnhUri] = useState<string | null>(data?.anhURL || null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Sync state when data loads (from cache or API)
  useEffect(() => {
    if (data) {
      setTen(data.ten || "");
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
    if (!ten) { showError("Nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await generateMoTa(ten, parseFloat(giaGoc) || 0, danhMuc);
      if (res.success) setMoTa(res.data?.moTa || res.data || res.moTa || "");
    } catch { showError("Không thể tạo mô tả"); }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!id || !ten || !giaGoc) { showError("Điền đủ tên và giá"); return; }
    setSaving(true);
    try {
      let anhURL = data?.anhURL || "";
      if (newImageUri) {
        setUploading(true);
        const uploadResult = await uploadImage(newImageUri);
        setUploading(false);
        if (uploadResult.success && uploadResult.url) {
          anhURL = uploadResult.url;
        } else {
          showError(uploadResult.error || "Không thể upload ảnh");
          setSaving(false);
          return;
        }
      }

      await updateProduct(id, {
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      showSuccess("Đã cập nhật sản phẩm");
      setTimeout(() => router.back(), 1000);
    } catch {
      showError("Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showSuccess("Đã xóa sản phẩm");
      setTimeout(() => router.replace("/(admin)/san-pham"), 1000);
    } catch {
      showError("Không thể xóa");
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(admin)/san-pham");
  };

  // No valid ID
  if (!id || id === "undefined" || id === "null") {
    return (
      <View style={[styles.container, styles.center]}>
        <AdminDetailHeader title="Sản phẩm" showNotification onBack={handleBack} />
        <View style={styles.centerContent}>
          <Ionicons name="shirt-outline" size={64} color={colors.stone[300]} />
          <Text style={styles.centerText}>Không tìm thấy sản phẩm</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading (only if no cached data)
  if (isLoading) {
    return (
      <View style={styles.container}>
        <AdminDetailHeader title="Chi tiết sản phẩm" showNotification onBack={handleBack} />
        <View style={styles.center}><LoadingSpinner size="lg" label="Đang tải..." /></View>
      </View>
    );
  }

  // Not found
  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <AdminDetailHeader title="Sản phẩm" showNotification onBack={handleBack} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.rose} />
          <Text style={styles.centerText}>Không tìm thấy sản phẩm</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const giaHienThi = parseFloat(giaGoc || "0") * (1 - (parseFloat(phanTramGiam || "0") || 0) / 100);
  const totalStock = sizes.length > 0 ? sizes.reduce((sum, s) => sum + s.soLuong, 0) : (data?.soLuong || 0);
  const categoryLabel = danhMuc ? categories.find((c: any) => c.id === danhMuc)?.tenDanhMuc || danhMuc : "Tất cả";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <AdminDetailHeader
        title="Chi tiết sản phẩm"
        showNotification
        onBack={handleBack}
        rightAction={{ icon: "trash-outline", onPress: () => setConfirmDelete(true) }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image */}
        <View style={styles.imageSection}>
          {newImageUri ? (
            <Image source={{ uri: newImageUri }} style={styles.image} resizeMode="cover" />
          ) : anhUri ? (
            <Image source={{ uri: anhUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={48} color={colors.stone[300]} />
              <Text style={styles.noImageText}>Chưa có ảnh</Text>
            </View>
          )}
          <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage} activeOpacity={0.7}>
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

        {/* Price info bar */}
        {parseFloat(giaGoc) > 0 && (
          <View style={[styles.priceBar, shadows.card]}>
            <View>
              <Text style={styles.priceLabel}>Giá hiển thị</Text>
              <Text style={styles.priceValue}>{formatMoney(giaHienThi)}</Text>
            </View>
            {parseFloat(phanTramGiam) > 0 && (
              <View style={styles.priceRight}>
                <Text style={styles.oldPrice}>{formatMoney(parseFloat(giaGoc))}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{phanTramGiam}%</Text>
                </View>
              </View>
            )}
            <View style={styles.stockInfo}>
              <Ionicons name="cube-outline" size={14} color={totalStock > 0 ? '#16A34A' : '#DC2626'} />
              <Text style={[styles.stockText, { color: totalStock > 0 ? '#16A34A' : '#DC2626' }]}>
                {totalStock} SP
              </Text>
            </View>
          </View>
        )}

        {/* Form */}
        <Input label="Tên sản phẩm" value={ten} onChangeText={setTen} placeholder="Nhập tên sản phẩm" />
        <Input label="Giá gốc (VNĐ)" value={giaGoc} onChangeText={setGiaGoc} keyboardType="numeric" placeholder="VD: 500000" />
        <Input label="% Giảm giá" value={phanTramGiam} onChangeText={setPhanTramGiam} keyboardType="numeric" placeholder="VD: 20" />

        {/* Category */}
        <Text style={styles.label}>Danh mục: <Text style={styles.labelValue}>{categoryLabel}</Text></Text>
        <View style={styles.chipsRow}>
          <TouchableOpacity style={[styles.chip, !danhMuc && styles.chipActive]} onPress={() => setDanhMuc("")}>
            <Text style={[styles.chipText, !danhMuc && styles.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, danhMuc === c.id && styles.chipActive]} onPress={() => setDanhMuc(c.id)}>
              <Text style={[styles.chipText, danhMuc === c.id && styles.chipTextActive]}>{c.tenDanhMuc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sizes */}
        <Text style={styles.label}>Sizes</Text>
        <View style={styles.chipsRow}>
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
            <View style={styles.sizeLabelWrap}>
              <Text style={styles.sizeLabel}>{s.ten}</Text>
            </View>
            <Input
              value={s.soLuong.toString()}
              onChangeText={(v) => updateSizeQty(s.ten, parseInt(v) || 0)}
              keyboardType="numeric"
              style={{ flex: 1, marginBottom: 0 }}
              inputStyle={{ paddingVertical: 6 }}
            />
          </View>
        ))}

        {/* Description */}
        <View style={styles.moTaHeader}>
          <Text style={styles.label}>Mô tả sản phẩm</Text>
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={styles.aiBtn} activeOpacity={0.7}>
            <Ionicons name="sparkles" size={18} color={generating ? colors.stone[300] : colors.blush} />
            <Text style={[styles.aiText, generating && { color: colors.stone[300] }]}>
              {generating ? "Đang tạo..." : "AI tạo"}
            </Text>
          </TouchableOpacity>
        </View>
        <Input value={moTa} onChangeText={setMoTa} multiline numberOfLines={6} placeholder="Mô tả chi tiết sản phẩm..." />

        {/* Availability */}
        <View style={[styles.switchRow, shadows.card]}>
          <View>
            <Text style={styles.switchLabel}>Còn hàng</Text>
            <Text style={styles.switchSub}>{conHang ? 'Sản phẩm đang bán' : 'Ngừng bán'}</Text>
          </View>
          <Switch value={conHang} onValueChange={setConHang} trackColor={{ false: colors.stone[200], true: colors.blush }} thumbColor={conHang ? colors.espresso : colors.stone[300]} />
        </View>

        <Button title="💾 Cập nhật sản phẩm" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Xóa sản phẩm?"
        message={`Bạn có chắc muốn xóa "${ten}"?`}
        confirmText="Xóa"
        isDanger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { justifyContent: "center", alignItems: "center" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  centerText: { fontSize: 14, color: colors.stone[400], marginTop: 12, textAlign: 'center' },
  backButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.espresso, borderRadius: borderRadius.sm },
  backButtonText: { color: colors.cream, fontWeight: '600' },
  scroll: { padding: 12, paddingBottom: 20, gap: 16 },
  imageSection: { alignItems: 'center' },
  image: { width: '100%', height: 240, borderRadius: borderRadius.md },
  noImage: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.stone[200], justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 12, color: colors.stone[400], marginTop: 8 },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.espresso, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.sm, marginTop: 10 },
  changeImageText: { fontSize: 12, color: colors.cream, fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadingText: { fontSize: 12, color: colors.stone[400] },

  priceBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: borderRadius.sm, padding: 14 },
  priceLabel: { fontSize: 10, textTransform: 'uppercase', color: colors.stone[400], fontWeight: '600', letterSpacing: 0.5 },
  priceValue: { fontSize: 20, fontWeight: '800', color: colors.espresso, marginTop: 2 },
  priceRight: { alignItems: 'flex-end', gap: 2 },
  oldPrice: { fontSize: 12, color: colors.stone[400], textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: `${colors.rose}15`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, color: colors.rose, fontWeight: '700' },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockText: { fontSize: 12, fontWeight: '600' },

  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  labelValue: { textTransform: 'none', color: colors.espresso, fontWeight: '500' },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 11, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },

  sizeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  sizeLabelWrap: { width: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: `${colors.blush}15`, borderRadius: 8, height: 38 },
  sizeLabel: { fontSize: 13, fontWeight: "600", color: colors.espresso },

  moTaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  aiText: { fontSize: 11, color: colors.blush, fontWeight: '600' },

  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, backgroundColor: colors.white, borderRadius: borderRadius.sm },
  switchLabel: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  switchSub: { fontSize: 11, color: colors.stone[400] },

  saveBtn: { marginBottom: 20 },
});
