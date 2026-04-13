import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduct, updateProduct, deleteProduct, getCategories } from "@/src/api/san-pham";
import { colors } from "@/src/theme";
import { QUICK_SIZES } from "@/src/utils/constants";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";

type SizeEntry = { ten: string; soLuong: number };

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  React.useEffect(() => {
    if (data) {
      setTen(data.ten);
      setGiaGoc(data.giaGoc?.toString() || "");
      setPhanTramGiam(data.phanTramGiam?.toString() || "");
      setMoTa(data.moTa || "");
      setDanhMuc(data.danhMuc || "");
      setConHang(data.conHang ?? true);
      setSizes(data.sizes || []);
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

  const handleSave = async () => {
    if (!ten || !giaGoc) { Alert.alert("Lỗi", "Điền đủ tên và giá"); return; }
    try {
      await updateProduct(id!, {
        ten,
        gia_goc: parseFloat(giaGoc),
        phan_tram_giam: phanTramGiam ? parseFloat(phanTramGiam) : null,
        mo_ta: moTa,
        danh_muc: danhMuc,
        con_hang: conHang,
        sizes: sizes.length > 0 ? sizes : [],
      });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Thành công", "Đã cập nhật sản phẩm");
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật");
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
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.espresso} /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Input label="Tên sản phẩm" value={ten} onChangeText={setTen} />
        <Input label="Giá gốc (VNĐ)" value={giaGoc} onChangeText={setGiaGoc} keyboardType="numeric" />
        <Input label="% Giảm giá" value={phanTramGiam} onChangeText={setPhanTramGiam} keyboardType="numeric" />

        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.filterChips}>
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
            <Input value={s.soLuong.toString()} onChangeText={(v) => updateSizeQty(s.ten, parseInt(v) || 0)} keyboardType="numeric" style={{ flex: 1, marginBottom: 0 }} />
          </View>
        ))}

        <Text style={styles.label}>Mô tả</Text>
        <Input value={moTa} onChangeText={setMoTa} multiline numberOfLines={6} />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Còn hàng</Text>
          <Switch value={conHang} onValueChange={setConHang} />
        </View>

        <Button title="CẬP NHẬT" onPress={handleSave} style={styles.saveBtn} />
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
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 11, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  sizeLabel: { fontSize: 14, fontWeight: "600", color: colors.espresso, width: 40 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  saveBtn: { marginBottom: 12 },
});
