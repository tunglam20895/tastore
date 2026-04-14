import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getTrangThaiKH, updateCustomer } from "@/src/api/khach-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { formatMoney, formatNumber } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";

export default function CustomersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [selectedKH, setSelectedKH] = useState<any | null>(null);
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editTrangThai, setEditTrangThai] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["customers", page, search, filterTT],
    queryFn: () => getCustomers({ page, limit: LIMIT_DEFAULT, search, trang_thai: filterTT }),
  });

  const { data: trangThaiList } = useQuery({
    queryKey: ["trang-thai-kh"],
    queryFn: () => getTrangThaiKH(),
  });
  const ttList = (trangThaiList as any)?.data || trangThaiList || [];

  const openModal = (kh: any) => {
    setSelectedKH(kh);
    setEditGhiChu(kh.ghiChu || "");
    setEditTrangThai(kh.trangThai);
    setModalVisible(true);
  };

  const handleSaveKH = async () => {
    if (!selectedKH) return;
    setSaving(true);
    try {
      await updateCustomer(selectedKH.sdt, { trang_thai: editTrangThai, ghi_chu: editGhiChu });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật khách hàng");
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật");
    }
    setSaving(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.ten}</Text>
        <View style={[styles.ttBadge, { backgroundColor: `${colors.blush}20` }]}>
          <Text style={[styles.ttText, { color: colors.blush }]}>{item.trangThai}</Text>
        </View>
      </View>
      <Text style={styles.sdt}>{item.sdt}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{formatNumber(item.tongDon)} đơn</Text>
        <Text style={styles.stat}>{formatMoney(item.tongDoanhThu)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Tìm theo tên hoặc SĐT..." placeholderTextColor={colors.stone[400]} />
        {ttList.length > 0 && (
          <View style={styles.filterChips}>
            <TouchableOpacity style={[styles.chip, !filterTT && styles.chipActive]} onPress={() => { setFilterTT(""); setPage(1); }}>
              <Text style={[styles.chipText, !filterTT && styles.chipTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {ttList.map((tt: any) => (
              <TouchableOpacity key={tt.id} style={[styles.chip, filterTT === tt.ten && styles.chipActive]} onPress={() => { setFilterTT(tt.ten); setPage(1); }}>
                <Text style={[styles.chipText, filterTT === tt.ten && styles.chipTextActive]}>{tt.ten}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !data?.data?.length ? (
        <EmptyState title="Không có khách hàng" />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.sdt}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          onEndReached={() => { if (page < (data?.totalPages ?? 1)) setPage(p => p + 1); }}
        />
      )}

      {/* Edit modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết khách hàng</Text>
            {selectedKH && (
              <>
                <Text style={styles.modalName}>{selectedKH.ten}</Text>
                <Text style={styles.modalSdt}>{selectedKH.sdt}</Text>
                <View style={styles.modalStats}>
                  <Text style={styles.modalStat}>{formatNumber(selectedKH.tongDon)} đơn · {formatMoney(selectedKH.tongDoanhThu)}</Text>
                </View>

                <Text style={styles.label}>Trạng thái</Text>
                <View style={styles.ttChips}>
                  {ttList.map((tt: any) => (
                    <TouchableOpacity key={tt.id} style={[styles.ttChip, editTrangThai === tt.ten && styles.ttChipActive]}
                      onPress={() => setEditTrangThai(tt.ten)}>
                      <Text style={[styles.ttChipText, editTrangThai === tt.ten && { color: colors.cream }]}>{tt.ten}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input label="Ghi chú" value={editGhiChu} onChangeText={setEditGhiChu} multiline numberOfLines={3} />
                <View style={styles.modalButtons}>
                  <Button title="Hủy" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
                  <Button title="Lưu" onPress={handleSaveKH} loading={saving} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  searchInput: { backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.espresso },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 10, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  ttBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ttText: { fontSize: 10, fontWeight: "600" },
  sdt: { fontSize: 12, color: colors.stone[500], marginTop: 4 },
  stats: { flexDirection: "row", gap: 16, marginTop: 8 },
  stat: { fontSize: 12, color: colors.stone[500] },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.espresso, marginBottom: 16 },
  modalName: { fontSize: 16, fontWeight: "600", color: colors.espresso },
  modalSdt: { fontSize: 14, color: colors.stone[500], marginTop: 4 },
  modalStats: { marginTop: 8, marginBottom: 16 },
  modalStat: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  ttChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  ttChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300] },
  ttChipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  ttChipText: { fontSize: 11, color: colors.stone[500] },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
});
