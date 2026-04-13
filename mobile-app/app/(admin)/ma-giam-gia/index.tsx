import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, RefreshControl, Alert, Modal } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/src/api/ma-giam-gia";
import { colors } from "@/src/theme";
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { formatMoney, formatDate } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";

export default function CouponsScreen() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ma, setMa] = useState("");
  const [loai, setLoai] = useState<"phan_tram" | "so_tien">("phan_tram");
  const [giaTri, setGiaTri] = useState("");
  const [giaTriToiDa, setGiaTriToiDa] = useState("");
  const [donHangToiThieu, setDonHangToiThieu] = useState("");
  const [soLuong, setSoLuong] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["coupons", page],
    queryFn: () => getCoupons({ page, limit: LIMIT_DEFAULT }),
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "TA-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setMa(code);
  };

  const handleCreate = async () => {
    if (!ma || !giaTri) { Alert.alert("Lỗi", "Điền đủ mã và giá trị"); return; }
    try {
      await createCoupon({
        ma: ma.toUpperCase(),
        loai,
        gia_tri: parseFloat(giaTri),
        gia_tri_toi_da: giaTriToiDa ? parseFloat(giaTriToiDa) : null,
        don_hang_toi_thieu: donHangToiThieu ? parseFloat(donHangToiThieu) : 0,
        so_luong: soLuong ? parseInt(soLuong) : 0,
      });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setShowAdd(false);
      setMa(""); setGiaTri(""); setGiaTriToiDa(""); setDonHangToiThieu(""); setSoLuong("");
      Alert.alert("Thành công", "Đã tạo mã giảm giá");
    } catch {
      Alert.alert("Lỗi", "Không thể tạo mã giảm giá");
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleCoupon(id, !current);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      Alert.alert("Thành công", "Đã xóa mã giảm giá");
    } catch {
      Alert.alert("Lỗi", "Không thể xóa");
    }
    setDeleteId(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.code}>{item.ma}</Text>
          <Text style={styles.type}>{item.loai === "phan_tram" ? `${item.giaTri}%` : formatMoney(item.giaTri)}</Text>
        </View>
        <View style={styles.rightSide}>
          <Switch value={item.conHieuLuc} onValueChange={() => handleToggle(item.id, item.conHieuLuc)} />
          <TouchableOpacity onPress={() => setDeleteId(item.id)}>
            <Ionicons name="trash" size={16} color={colors.rose} style={{ marginTop: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.usage}>Đã dùng: {item.daDung}/{item.soLuong}</Text>
        <Text style={styles.minOrder}>Tối thiểu: {formatMoney(item.donHangToiThieu)}</Text>
        {item.ngayHetHan && <Text style={styles.expiry}>Hết hạn: {formatDate(item.ngayHetHan)}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mã giảm giá</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { generateCode(); setShowAdd(true); }}>
          <Ionicons name="add" size={20} color={colors.cream} />
        </TouchableOpacity>
      </View>

      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !data?.data?.length ? (
        <EmptyState title="Chưa có mã giảm giá" actionLabel="Thêm mới" onAction={() => { generateCode(); setShowAdd(true); }} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          onEndReached={() => { if (page < (data?.totalPages ?? 1)) setPage(p => p + 1); }}
        />
      )}

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm mã giảm giá</Text>
            <View style={styles.codeRow}>
              <Input value={ma} onChangeText={setMa} placeholder="Mã giảm giá" style={{ flex: 1 }} />
              <TouchableOpacity style={styles.genBtn} onPress={generateCode}>
                <Ionicons name="shuffle" size={20} color={colors.cream} />
              </TouchableOpacity>
            </View>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, loai === "phan_tram" && styles.typeBtnActive]} onPress={() => setLoai("phan_tram")}>
                <Text style={[styles.typeBtnText, loai === "phan_tram" && { color: colors.cream }]}>Phần trăm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, loai === "so_tien" && styles.typeBtnActive]} onPress={() => setLoai("so_tien")}>
                <Text style={[styles.typeBtnText, loai === "so_tien" && { color: colors.cream }]}>Số tiền</Text>
              </TouchableOpacity>
            </View>
            <Input label="Giá trị" value={giaTri} onChangeText={setGiaTri} keyboardType="numeric" />
            {loai === "phan_tram" && <Input label="Giảm tối đa (VNĐ)" value={giaTriToiDa} onChangeText={setGiaTriToiDa} keyboardType="numeric" />}
            <Input label="Đơn tối thiểu (VNĐ)" value={donHangToiThieu} onChangeText={setDonHangToiThieu} keyboardType="numeric" />
            <Input label="Số lượng" value={soLuong} onChangeText={setSoLuong} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <Button title="Hủy" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Tạo" onPress={handleCreate} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Xóa mã giảm giá?" message="Hành động này không thể hoàn tác." confirmText="Xóa" isDanger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  title: { fontSize: 18, fontWeight: "300", letterSpacing: 2, color: colors.espresso },
  addBtn: { padding: 10, backgroundColor: colors.espresso, borderRadius: 8 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  code: { fontSize: 14, fontWeight: "700", color: colors.espresso, fontFamily: "monospace" },
  type: { fontSize: 16, fontWeight: "700", color: colors.rose, marginTop: 4 },
  rightSide: { alignItems: "flex-end", gap: 4 },
  cardFooter: { marginTop: 8, gap: 4 },
  usage: { fontSize: 11, color: colors.stone[500] },
  minOrder: { fontSize: 11, color: colors.stone[500] },
  expiry: { fontSize: 11, color: colors.stone[400] },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.espresso, marginBottom: 16 },
  codeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  genBtn: { padding: 10, backgroundColor: colors.blush, borderRadius: 8, alignSelf: "flex-end" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.stone[300], alignItems: "center" },
  typeBtnActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  typeBtnText: { fontSize: 12, fontWeight: "600", color: colors.stone[500] },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
});
