import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  Switch, KeyboardAvoidingView, Platform, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { createProduct, getCategories, generateMoTa } from "@/src/api/san-pham";
import { colors } from "@/src/theme";
import { QUICK_SIZES } from "@/src/utils/constants";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
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
  const [generating, setGenerating] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => import("@/src/api/san-pham").then(m => m.getCategories()),
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

  const handleGenerate = async () => {
    if (!ten) { Alert.alert("Lỗi", "Nhập tên sản phẩm trước"); return; }
    setGenerating(true);
    try {
      const res = await generateMoTa(ten, parseFloat(giaGoc) || 0, danhMuc);
      if (res.success) setMoTa(res.data || res.moTa || "");
    } catch { Alert.alert("Lỗi", "Không thể tạo mô tả"); }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!ten || !giaGoc) { Alert.alert("Lỗi", "Điền đủ tên và giá"); return; }

    try {
      let anhURL = "";
      // Note: Upload would need multipart, for now skip
      const productData: Record<string, unknown> = {
        ten,
        gia_goc: parseFloat(giaGoc),
        phan_tram_giam: phanTramGiam ? parseFloat(phanTramGiam) : null,
        mo_ta: moTa,
        danh_muc: danhMuc,
        con_hang: conHang,
        sizes: sizes.length > 0 ? sizes : [],
      };

      await createProduct(productData);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Thành công", "Đã thêm sản phẩm");
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể thêm sản phẩm");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {anhUri ? (
            <Text style={styles.imageText}>✅ Đã chọn ảnh</Text>
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={colors.stone[400]} />
              <Text style={styles.imageText}>Chọn ảnh sản phẩm</Text>
            </>
          )}
        </TouchableOpacity>

        <Input label="Tên sản phẩm" value={ten} onChangeText={setTen} placeholder="Nhập tên sản phẩm" />
        <Input label="Giá gốc (VNĐ)" value={giaGoc} onChangeText={setGiaGoc} keyboardType="numeric" placeholder="VD: 500000" />
        <Input label="% Giảm giá" value={phanTramGiam} onChangeText={setPhanTramGiam} keyboardType="numeric" placeholder="VD: 20" />

        {/* Categories */}
        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.filterChips}>
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
                <TextInput
                  style={styles.sizeQtyInput}
                  value={s.soLuong.toString()}
                  onChangeText={(v) => updateSizeQty(s.ten, v)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        )}

        {/* Description + AI */}
        <View style={styles.moTaHeader}>
          <Text style={styles.label}>Mô tả</Text>
          <TouchableOpacity onPress={handleGenerate} disabled={generating}>
            <Ionicons name="sparkles-outline" size={20} color={generating ? colors.stone[300] : colors.blush} />
          </TouchableOpacity>
        </View>
        <Input value={moTa} onChangeText={setMoTa} placeholder="Mô tả sản phẩm..." multiline numberOfLines={6} />

        {/* Con hang */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Còn hàng</Text>
          <Switch value={conHang} onValueChange={setConHang} />
        </View>

        <Button title="LƯU SẢN PHẨM" onPress={handleSave} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 16 },
  imagePicker: { height: 180, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.stone[300], justifyContent: "center", alignItems: "center", marginBottom: 16 },
  imageText: { fontSize: 12, color: colors.stone[400], marginTop: 8 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 11, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  sizeQtySection: { marginBottom: 16 },
  sizeQtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  sizeQtyLabel: { fontSize: 14, fontWeight: "600", color: colors.espresso, width: 40 },
  sizeQtyInput: { flex: 1, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.stone[300], paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
  moTaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  saveBtn: { marginBottom: 32 },
});
