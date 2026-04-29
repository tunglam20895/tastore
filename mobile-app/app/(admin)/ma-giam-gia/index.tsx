import React, { useState, useCallback } from "react";
import { useRequireQuyen } from "@/src/hooks/useRequireQuyen";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/src/api/ma-giam-gia";
import { colors } from "@/src/theme";
import { legacyColors } from '@/src/theme/legacy-colors';
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { formatMoney, formatDate } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";

export default function CouponsScreen() {
  useRequireQuyen('ma-giam-gia');
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
    if (!ma.trim()) { showError("Vui lòng nhập mã"); return; }
    if (!giaTri || isNaN(parseFloat(giaTri))) { showError("Giá trị không hợp lệ"); return; }
    if (loai === 'phan_tram' && parseFloat(giaTri) > 100) {
      showError("Phần trăm không được vượt quá 100"); return;
    }
    try {
      await createCoupon({
        ma: ma.trim().toUpperCase(),
        loai,
        giaTri: parseFloat(giaTri),
        giaTriToiDa: giaTriToiDa ? parseFloat(giaTriToiDa) : null,
        donHangToiThieu: donHangToiThieu ? parseFloat(donHangToiThieu) : 0,
        soLuong: soLuong ? parseInt(soLuong) : 1,
      });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setShowAdd(false);
      setMa(""); setGiaTri(""); setGiaTriToiDa(""); setDonHangToiThieu(""); setSoLuong("");
      showSuccess("Đã tạo mã giảm giá");
    } catch (err: any) {
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        showError("Bạn không có quyền tạo mã giảm giá");
      } else if (status === 409 || apiMsg?.toLowerCase?.().includes('exist')) {
        showError("Mã đã tồn tại, vui lòng chọn mã khác");
      } else {
        showError(apiMsg || "Không thể tạo mã giảm giá");
      }
      console.error('[ma-giam-gia] create error:', err?.response?.data || err);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleCoupon(id, !current);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    } catch {
      showError("Không thể cập nhật");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      showSuccess("Đã xóa mã giảm giá");
    } catch {
      showError("Không thể xóa");
    }
    setDeleteId(null);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.code}>{item.ma}</Text>
          <Text style={styles.type}>{item.loai === "phan_tram" ? `${item.giaTri}%` : formatMoney(item.giaTri)}</Text>
        </View>
        <View style={styles.rightSide}>
          <Switch value={item.conHieuLuc} onValueChange={() => handleToggle(item.id, item.conHieuLuc)} />
          <TouchableOpacity onPress={() => setDeleteId(item.id)}>
            <Ionicons name="trash" size={16} color={legacyColors.rose} style={{ marginTop: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.usage}>Đã dùng: {item.daDung}/{item.soLuong}</Text>
        <Text style={styles.minOrder}>Tối thiểu: {formatMoney(item.donHangToiThieu)}</Text>
        {item.ngayHetHan && <Text style={styles.expiry}>Hết hạn: {formatDate(item.ngayHetHan)}</Text>}
      </View>
    </View>
  ), [handleToggle, setDeleteId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mã giảm giá</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { generateCode(); setShowAdd(true); }}>
          <Ionicons name="add" size={20} color={legacyColors.cream} />
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
          onEndReachedThreshold={0.3}
          windowSize={10}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Thêm mã giảm giá</Text>
                <View style={styles.codeRow}>
                  <Input value={ma} onChangeText={setMa} placeholder="Mã giảm giá" style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.genBtn} onPress={generateCode}>
                    <Ionicons name="shuffle" size={20} color={legacyColors.cream} />
                  </TouchableOpacity>
                </View>
                <View style={styles.typeRow}>
                  <TouchableOpacity style={[styles.typeBtn, loai === "phan_tram" && styles.typeBtnActive]} onPress={() => setLoai("phan_tram")}>
                    <Text style={[styles.typeBtnText, loai === "phan_tram" && { color: legacyColors.cream }]}>Phần trăm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, loai === "so_tien" && styles.typeBtnActive]} onPress={() => setLoai("so_tien")}>
                    <Text style={[styles.typeBtnText, loai === "so_tien" && { color: legacyColors.cream }]}>Số tiền</Text>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Xóa mã giảm giá?" message="Hành động này không thể hoàn tác." confirmText="Xóa" isDanger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: legacyColors.cream },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: legacyColors.white, borderBottomWidth: 1, borderBottomColor: legacyColors.stone[200] },
  title: { fontSize: 18, fontWeight: "300", letterSpacing: 2, color: legacyColors.espresso },
  addBtn: { padding: 10, backgroundColor: legacyColors.espresso, borderRadius: 8 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: legacyColors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: legacyColors.stone[300] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  code: { fontSize: 14, fontWeight: "700", color: legacyColors.espresso, fontFamily: "monospace" },
  type: { fontSize: 16, fontWeight: "700", color: legacyColors.rose, marginTop: 4 },
  rightSide: { alignItems: "flex-end", gap: 4 },
  cardFooter: { marginTop: 8, gap: 4 },
  usage: { fontSize: 11, color: legacyColors.stone[500] },
  minOrder: { fontSize: 11, color: legacyColors.stone[500] },
  expiry: { fontSize: 11, color: legacyColors.stone[400] },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: legacyColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: legacyColors.espresso, marginBottom: 16 },
  codeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  genBtn: { padding: 10, backgroundColor: legacyColors.blush, borderRadius: 8, alignSelf: "flex-end" },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: legacyColors.stone[300], alignItems: "center" },
  typeBtnActive: { backgroundColor: legacyColors.espresso, borderColor: legacyColors.espresso },
  typeBtnText: { fontSize: 12, fontWeight: "600", color: legacyColors.stone[500] },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
});
