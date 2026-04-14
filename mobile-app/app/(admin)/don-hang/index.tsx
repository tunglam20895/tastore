import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Modal, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders, updateOrderStatus, bulkUpdateStatus } from "@/src/api/don-hang";
import { colors } from "@/src/theme";
import { LIMIT_DEFAULT, ORDER_STATUSES, STATUS_COLORS, STATUS_COLORS_BG } from "@/src/utils/constants";
import { formatMoney, formatRelativeTime } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTen, setSearchTen] = useState("");
  const [searchSdt, setSearchSdt] = useState("");
  const [trangThai, setTrangThai] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [tuNgay, setTuNgay] = useState<Date | null>(null);
  const [denNgay, setDenNgay] = useState<Date | null>(null);


  // Bulk select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders", page, searchTen, searchSdt, trangThai, tuNgay, denNgay],
    queryFn: () => getOrders({
      page, limit: LIMIT_DEFAULT,
      search_ten: searchTen, search_sdt: searchSdt, trang_thai: trangThai,
      tu_ngay: tuNgay ? tuNgay.toISOString().split('T')[0] : undefined,
      den_ngay: denNgay ? denNgay.toISOString().split('T')[0] : undefined,
    }),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (data?.data) {
      setSelectedIds(data.data.map((o: any) => o.id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkMode(false);
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateStatus(selectedIds, status);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      clearSelection();
      setBulkStatusModal(false);
      Alert.alert("Thành công", `Đã cập nhật ${selectedIds.length} đơn hàng`);
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái hàng loạt");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, bulkMode && styles.cardBulk]}
      onPress={() => bulkMode ? toggleSelect(item.id) : router.push({ pathname: "/(admin)/don-hang/[id]", params: { id: item.id } })}
    >
      {bulkMode && (
        <View style={[styles.checkbox, selectedIds.includes(item.id) && styles.checkboxChecked]}>
          {selectedIds.includes(item.id) && <Ionicons name="checkmark" size={14} color={colors.cream} />}
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.customerName}>{item.tenKH}</Text>
          <Text style={styles.phone}>{item.sdt}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS_BG[item.trangThai] || colors.cream }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.trangThai] || colors.stone[500] }]}>
            {item.trangThai}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatMoney(item.tongTien)}</Text>
        <Text style={styles.time}>{formatRelativeTime(item.thoiGian)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search & Bulk bar */}
      {bulkMode ? (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkText}>{selectedIds.length} đã chọn</Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkActionBtn} onPress={selectAll}>
              <Ionicons name="checkmark-done" size={18} color={colors.espresso} />
              <Text style={styles.bulkActionText}>Chọn tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bulkActionBtn, styles.bulkStatusBtn]} onPress={() => setBulkStatusModal(true)}>
              <Ionicons name="swap-horizontal" size={18} color={colors.cream} />
              <Text style={[styles.bulkActionText, { color: colors.cream }]}>Đổi trạng thái</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={clearSelection}>
            <Ionicons name="close" size={22} color={colors.rose} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.stone[400]} />
              <TextInput
                style={styles.searchInput}
                value={searchTen}
                onChangeText={setSearchTen}
                placeholder="Tìm tên khách..."
                placeholderTextColor={colors.stone[400]}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
              <Ionicons name="options" size={20} color={colors.espresso} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkBtn} onPress={() => setBulkMode(true)}>
              <Ionicons name="checkbox" size={20} color={colors.espresso} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter panel */}
      {showFilter && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Trạng thái</Text>
          <View style={styles.statusChips}>
            <TouchableOpacity style={[styles.chip, !trangThai && styles.chipActive]} onPress={() => { setTrangThai(""); setPage(1); }}>
              <Text style={[styles.chipText, !trangThai && styles.chipTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {ORDER_STATUSES.map(stt => (
              <TouchableOpacity key={stt} style={[styles.chip, trangThai === stt && styles.chipActive]}
                onPress={() => { setTrangThai(stt); setPage(1); }}>
                <Text style={[styles.chipText, trangThai === stt && styles.chipTextActive]}>{stt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInputBox}>
              <Ionicons name="calendar" size={16} color={colors.stone[500]} />
              <TextInput
                style={styles.dateInput}
                value={tuNgay ? tuNgay.toISOString().split('T')[0] : ''}
                onChangeText={(v) => { 
                  // Accept YYYY-MM-DD format
                  const cleaned = v.replace(/[^\d-]/g, '');
                  if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    setTuNgay(new Date(cleaned));
                    setPage(1);
                  } else if (v === '') {
                    setTuNgay(null);
                    setPage(1);
                  }
                }}
                placeholder="Từ ngày (YYYY-MM-DD)"
                placeholderTextColor={colors.stone[300]}
              />
            </View>
            <View style={styles.dateInputBox}>
              <Ionicons name="calendar" size={16} color={colors.stone[500]} />
              <TextInput
                style={styles.dateInput}
                value={denNgay ? denNgay.toISOString().split('T')[0] : ''}
                onChangeText={(v) => { 
                  const cleaned = v.replace(/[^\d-]/g, '');
                  if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    setDenNgay(new Date(cleaned));
                    setPage(1);
                  } else if (v === '') {
                    setDenNgay(null);
                    setPage(1);
                  }
                }}
                placeholder="Đến ngày (YYYY-MM-DD)"
                placeholderTextColor={colors.stone[300]}
              />
            </View>
            {(tuNgay || denNgay) && (
              <TouchableOpacity onPress={() => { setTuNgay(null); setDenNgay(null); setPage(1); }}>
                <Text style={styles.clearDateText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sdtBox}>
            <Ionicons name="call" size={16} color={colors.stone[400]} />
            <TextInput
              style={styles.sdtInput}
              value={searchSdt}
              onChangeText={setSearchSdt}
              placeholder="Tìm theo SĐT..."
              placeholderTextColor={colors.stone[400]}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      )}

      {/* List */}
      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !data?.data?.length ? (
        <EmptyState title="Không có đơn hàng" />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          onEndReached={() => { if (page < (data?.totalPages ?? 1)) setPage(p => p + 1); }}
          ListFooterComponent={isFetching ? <LoadingSpinner size="sm" /> : null}
        />
      )}

      {/* Bulk status modal */}
      <Modal visible={bulkStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn trạng thái mới</Text>
            <View style={styles.statusGrid}>
              {ORDER_STATUSES.map(stt => (
                <TouchableOpacity key={stt} style={[styles.statusModalBtn, { borderColor: STATUS_COLORS[stt] }]}
                  onPress={() => { setBulkStatusModal(false); handleBulkStatus(stt); }}>
                  <View style={[styles.statusModalDot, { backgroundColor: STATUS_COLORS[stt] }]} />
                  <Text style={styles.statusModalText}>{stt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Hủy" onPress={() => setBulkStatusModal(false)} variant="ghost" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.espresso, marginLeft: 8 },
  filterBtn: { padding: 10, backgroundColor: colors.cream, borderRadius: 8 },
  bulkBtn: { padding: 10, backgroundColor: colors.cream, borderRadius: 8 },
  bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: `${colors.espresso}10`, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  bulkText: { fontSize: 14, fontWeight: '600', color: colors.espresso },
  bulkActions: { flexDirection: 'row', gap: 12 },
  bulkActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  bulkStatusBtn: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  bulkActionText: { fontSize: 11, fontWeight: '600', color: colors.espresso },
  filterPanel: { padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  filterLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[600], marginBottom: 8, fontWeight: "600" },
  statusChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 10, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  dateRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  dateInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dateInput: { flex: 1, paddingVertical: 6, fontSize: 12, color: colors.espresso },
  clearDateText: { fontSize: 12, color: colors.rose, fontWeight: '600' },
  sdtBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 12, marginTop: 8 },
  sdtInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.espresso, marginLeft: 8 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardBulk: { paddingLeft: 48 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 10, color: colors.stone[400], fontFamily: "monospace" },
  customerName: { fontSize: 14, fontWeight: "600", color: colors.espresso, marginTop: 2 },
  phone: { fontSize: 12, color: colors.stone[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  total: { fontSize: 16, fontWeight: "700", color: colors.espresso },
  time: { fontSize: 11, color: colors.stone[400] },
  checkbox: { position: 'absolute', left: 12, top: 14, width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.stone[300], justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.espresso, marginBottom: 16, textAlign: 'center' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  statusModalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.stone[300], backgroundColor: colors.white, minWidth: '45%' },
  statusModalDot: { width: 8, height: 8, borderRadius: 4 },
  statusModalText: { fontSize: 12, fontWeight: '600', color: colors.espresso },
});
