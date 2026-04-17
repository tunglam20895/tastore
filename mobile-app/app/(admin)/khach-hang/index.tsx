import React, { useState, useCallback } from "react";
import { useDebounce } from "@/src/hooks/useDebounce";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getTrangThaiKH, updateCustomer, deleteCustomer } from "@/src/api/khach-hang";
import { getOrders } from "@/src/api/don-hang";
import { Image } from "expo-image";
import { useAuthStore } from "@/src/store/authStore";
import { colors, shadows, borderRadius } from "@/src/theme";
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { formatMoney, formatNumber } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";

export default function CustomersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedKH, setSelectedKH] = useState<any | null>(null);
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editTrangThai, setEditTrangThai] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteKH, setDeleteKH] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["customers", page, debouncedSearch, filterTT],
    queryFn: () => getCustomers({ page, limit: LIMIT_DEFAULT, search: debouncedSearch, trang_thai: filterTT }),
  });

  const { data: trangThaiList } = useQuery({
    queryKey: ["trang-thai-kh"],
    queryFn: () => getTrangThaiKH(),
  });
  const ttList = (trangThaiList as any)?.data || trangThaiList || [];

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["customerOrders", selectedKH?.sdt],
    queryFn: () => getOrders({ page: 1, limit: 50, sdt: selectedKH.sdt }),
    enabled: !!selectedKH?.sdt,
  });
  const customerOrders = ordersData?.data || [];

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
      showSuccess("Đã cập nhật khách hàng");
    } catch {
      showError("Không thể cập nhật");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteKH) return;
    try {
      await deleteCustomer(deleteKH);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteKH(null);
      showSuccess("Đã xóa khách hàng");
    } catch {
      showError("Không thể xóa");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={[styles.card, shadows.card]}>
      <TouchableOpacity style={styles.cardTop} onPress={() => openModal(item)} activeOpacity={0.7}>
        <View style={styles.customerAvatar}>
          <Text style={styles.avatarText}>{getInitials(item.ten)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardInfoRow}>
            <Text style={styles.name} numberOfLines={1}>{item.ten}</Text>
            <View style={[styles.ttBadge, { backgroundColor: `${colors.blush}15` }]}>
              <Text style={[styles.ttText, { color: colors.blush }]}>{item.trangThai}</Text>
            </View>
          </View>
          <Text style={styles.sdt}>{item.sdt}</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={12} color={colors.stone[400]} />
              <Text style={styles.stat}>{formatNumber(item.tongDon)} đơn</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={12} color={colors.stone[400]} />
              <Text style={styles.stat}>{formatMoney(item.tongDoanhThu)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
          <Ionicons name="pencil-outline" size={16} color={colors.stone[400]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteKH(item.sdt)}>
          <Ionicons name="trash-outline" size={16} color={colors.rose} />
        </TouchableOpacity>
      </View>
    </View>
  ), [openModal, setDeleteKH]);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.stone[400]} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            placeholder="Tìm theo tên hoặc SĐT..."
            placeholderTextColor={colors.stone[300]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }}>
              <Ionicons name="close-circle" size={18} color={colors.stone[300]} />
            </TouchableOpacity>
          )}
        </View>
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
        <EmptyState title="Không có khách hàng" description={search || filterTT ? "Thử thay đổi bộ lọc" : ""} />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.sdt}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.blush} />}
          onEndReached={() => { if (page < (data?.totalPages ?? 1)) setPage(p => p + 1); }}
          onEndReachedThreshold={0.3}
          windowSize={10}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Edit modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            {/* Overlay tap to close */}
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết khách hàng</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.stone[500]} />
                </TouchableOpacity>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {selectedKH && (
                  <>
                    <View style={styles.modalCustomerInfo}>
                      <View style={styles.modalAvatar}>
                        <Text style={styles.modalAvatarText}>{getInitials(selectedKH.ten)}</Text>
                      </View>
                      <View>
                        <Text style={styles.modalName}>{selectedKH.ten}</Text>
                        <Text style={styles.modalSdt}>{selectedKH.sdt}</Text>
                      </View>
                    </View>
                    <View style={styles.modalStatsRow}>
                      <View style={styles.modalStatCard}>
                        <Ionicons name="cube-outline" size={20} color={colors.blush} />
                        <Text style={styles.modalStatValue}>{formatNumber(selectedKH.tongDon)}</Text>
                        <Text style={styles.modalStatLabel}>Đơn hàng</Text>
                      </View>
                      <View style={styles.modalStatCard}>
                        <Ionicons name="cash-outline" size={20} color={colors.rose} />
                        <Text style={styles.modalStatValue}>{formatMoney(selectedKH.tongDoanhThu)}</Text>
                        <Text style={styles.modalStatLabel}>Doanh thu</Text>
                      </View>
                    </View>

                    <Text style={styles.label}>Trạng thái</Text>
                    <View style={styles.ttChips}>
                      {ttList.map((tt: any) => (
                        <TouchableOpacity
                          key={tt.id}
                          style={[styles.ttChip, editTrangThai === tt.ten && styles.ttChipActive]}
                          onPress={() => setEditTrangThai(tt.ten)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.ttChipText, editTrangThai === tt.ten && { color: colors.cream }]}>{tt.ten}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Input label="Ghi chú" value={editGhiChu} onChangeText={setEditGhiChu} multiline numberOfLines={3} />

                    <Text style={[styles.label, { marginTop: 16 }]}>Lịch sử mua hàng</Text>
                    {loadingOrders ? (
                      <LoadingSpinner size="sm" />
                    ) : customerOrders.length === 0 ? (
                      <Text style={styles.noOrdersText}>Chưa có đơn hàng nào</Text>
                    ) : (
                      <View style={styles.orderHistoryList}>
                        {customerOrders.map((order: any) => (
                          <TouchableOpacity 
                            key={order.id} 
                            style={styles.historyOrderCard}
                            onPress={() => {
                              setModalVisible(false);
                              router.push({
                                pathname: "/(admin)/don-hang/[id]",
                                params: { id: order.id, cachedData: JSON.stringify(order) },
                              });
                            }}
                          >
                            <View style={styles.historyOrderHeader}>
                              <Text style={styles.historyOrderId}>Đơn #{order.id}</Text>
                              <Text style={styles.historyOrderTotal}>{formatMoney(order.tongTien)}</Text>
                            </View>
                            
                            <View style={styles.historyProducts}>
                              {order.sanPham && order.sanPham.map((sp: any, idx: number) => (
                                <View key={idx} style={styles.historyProductRow}>
                                  {sp.anhURL ? (
                                    <Image
                                      source={{ uri: sp.anhURL }}
                                      style={styles.historyProductImg}
                                      contentFit="cover"
                                      transition={200}
                                      cachePolicy="memory-disk"
                                    />
                                  ) : (
                                    <View style={[styles.historyProductImg, styles.historyProductPlaceholder]}>
                                      <Ionicons name="shirt-outline" size={14} color={colors.stone[300]} />
                                    </View>
                                  )}
                                  <View style={styles.historyProductInfo}>
                                    <Text style={styles.historyProductName} numberOfLines={1}>{sp.ten}</Text>
                                    <Text style={styles.historyProductMeta}>
                                      {sp.sizeChon ? `Size: ${sp.sizeChon} • ` : ''}SL: {sp.soLuong}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={styles.modalButtons}>
                      <Button title="Hủy" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
                      <Button title="Lưu" onPress={handleSaveKH} loading={saving} style={{ flex: 1 }} />
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteKH}
        title="Xóa khách hàng?"
        message="Hành động này không thể hoàn tác."
        confirmText="Xóa"
        isDanger
        onConfirm={handleDelete}
        onCancel={() => setDeleteKH(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: `${colors.stone[200]}40` },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.espresso, marginLeft: 8 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 10, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  list: { padding: 12, gap: 10, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  cardTop: { flex: 1, flexDirection: "row", alignItems: "center", padding: 14 },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.espresso,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.cream },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 14, fontWeight: "700", color: colors.espresso, flex: 1 },
  ttBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ttText: { fontSize: 9, fontWeight: "600" },
  sdt: { fontSize: 12, color: colors.stone[400], marginTop: 2 },
  stats: { flexDirection: "row", gap: 12, marginTop: 6 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stat: { fontSize: 11, color: colors.stone[400] },
  cardActions: { flexDirection: 'column', gap: 4, paddingRight: 12 },
  actionBtn: { padding: 6, borderRadius: 8, backgroundColor: `${colors.stone[100]}80` },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: "92%",
    ...shadows.card,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.espresso },
  modalCustomerInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  modalAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.espresso, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { fontSize: 16, fontWeight: '700', color: colors.cream },
  modalName: { fontSize: 16, fontWeight: "700", color: colors.espresso },
  modalSdt: { fontSize: 13, color: colors.stone[500], marginTop: 2 },
  modalStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  modalStatCard: { flex: 1, backgroundColor: `${colors.blush}10`, borderRadius: borderRadius.sm, padding: 14, alignItems: 'center', gap: 4 },
  modalStatValue: { fontSize: 16, fontWeight: "800", color: colors.espresso },
  modalStatLabel: { fontSize: 10, color: colors.stone[400], fontWeight: '500' },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 8 },
  ttChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  ttChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300] },
  ttChipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  ttChipText: { fontSize: 11, color: colors.stone[500] },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },

  // Order history
  noOrdersText: { fontSize: 12, color: colors.stone[400], fontStyle: 'italic', marginBottom: 16 },
  orderHistoryList: { gap: 12, marginBottom: 16 },
  historyOrderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadows.card,
  },
  historyOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[100]}80`,
  },
  historyOrderId: { fontSize: 12, fontWeight: '700', color: colors.espresso },
  historyOrderTotal: { fontSize: 13, fontWeight: '800', color: colors.rose },
  historyProducts: { gap: 8 },
  historyProductRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyProductImg: { width: 36, height: 36, borderRadius: 6, backgroundColor: colors.stone[100] },
  historyProductPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  historyProductInfo: { flex: 1 },
  historyProductName: { fontSize: 12, fontWeight: '600', color: colors.espresso },
  historyProductMeta: { fontSize: 10, color: colors.stone[500], marginTop: 2 },
});
