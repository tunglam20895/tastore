import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Modal, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders, updateOrderStatus, bulkUpdateStatus } from "@/src/api/don-hang";
import { colors, shadows, borderRadius } from "@/src/theme";
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, shadows.card, bulkMode && styles.cardBulk]}
      onPress={() => bulkMode ? toggleSelect(item.id) : router.push({
        pathname: "/(admin)/don-hang/[id]",
        params: { id: item.id, cachedData: JSON.stringify(item) },
      })}
      activeOpacity={0.7}
    >
      {bulkMode && (
        <View style={[styles.checkbox, selectedIds.includes(item.id) && styles.checkboxChecked]}>
          {selectedIds.includes(item.id) && <Ionicons name="checkmark" size={14} color={colors.cream} />}
        </View>
      )}

      {/* Customer avatar */}
      <View style={styles.cardLeft}>
        <View style={styles.customerAvatar}>
          <Text style={styles.customerAvatarText}>{getInitials(item.tenKH)}</Text>
        </View>
      </View>

      {/* Card content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTopRow}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS_BG[item.trangThai] || `${colors.blush}15` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.trangThai] || colors.stone[500] }]}>
                  {item.trangThai}
                </Text>
              </View>
            </View>
            <Text style={styles.customerName} numberOfLines={1}>{item.tenKH}</Text>
            <Text style={styles.phone}>{item.sdt}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.total}>{formatMoney(item.tongTien)}</Text>
            <Text style={styles.time}>{formatRelativeTime(item.thoiGian)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeFilterCount = (trangThai ? 1 : 0) + (tuNgay ? 1 : 0) + (denNgay ? 1 : 0) + (searchSdt ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Đơn hàng</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addOrderBtn} onPress={() => router.push("/(admin)/don-hang/add")} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={colors.cream} />
            <Text style={styles.addOrderBtnText}>Tạo đơn</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Search & Bulk bar */}
      {bulkMode ? (
        <View style={styles.bulkBar}>
          <View style={styles.bulkLeft}>
            <Ionicons name="checkbox" size={18} color={colors.espresso} />
            <Text style={styles.bulkText}>{selectedIds.length} đã chọn</Text>
          </View>
          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkActionBtn} onPress={selectAll}>
              <Ionicons name="checkmark-done" size={16} color={colors.espresso} />
              <Text style={styles.bulkActionText}>Tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bulkActionBtn, styles.bulkStatusBtn]} onPress={() => setBulkStatusModal(true)}>
              <Ionicons name="swap-horizontal" size={16} color={colors.cream} />
              <Text style={[styles.bulkActionText, { color: colors.cream }]}>Đổi TT</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={clearSelection} style={styles.bulkCloseBtn}>
            <Ionicons name="close" size={20} color={colors.rose} />
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
                onChangeText={(v) => { setSearchTen(v); setPage(1); }}
                placeholder="Tìm tên khách..."
                placeholderTextColor={colors.stone[400]}
              />
              {searchTen.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchTen(""); setPage(1); }}>
                  <Ionicons name="close-circle" size={18} color={colors.stone[300]} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
              onPress={() => setShowFilter(!showFilter)}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? colors.white : colors.espresso} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkBtn}
              onPress={() => setBulkMode(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkbox-outline" size={18} color={colors.espresso} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick status filter chips */}
      <View style={styles.quickFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersInner}>
          <TouchableOpacity
            style={[styles.quickChip, !trangThai && styles.quickChipActive]}
            onPress={() => { setTrangThai(""); setPage(1); }}
          >
            <Text style={[styles.quickChipText, !trangThai && styles.quickChipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {ORDER_STATUSES.map(stt => (
            <TouchableOpacity
              key={stt}
              style={[
                styles.quickChip,
                trangThai === stt && styles.quickChipActive,
              ]}
              onPress={() => { setTrangThai(stt); setPage(1); }}
            >
              <View style={[
                styles.quickChipDot,
                { backgroundColor: trangThai === stt ? colors.white : STATUS_COLORS[stt] },
              ]} />
              <Text style={[
                styles.quickChipText,
                trangThai === stt && styles.quickChipTextActive,
                trangThai !== stt && { color: STATUS_COLORS[stt] },
              ]}>{stt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Advanced filter panel */}
      {showFilter && (
        <View style={styles.filterPanel}>
          <View style={styles.dateRow}>
            <View style={styles.dateInputBox}>
              <Ionicons name="calendar-outline" size={16} color={colors.stone[400]} />
              <TextInput
                style={styles.dateInput}
                value={tuNgay ? tuNgay.toISOString().split('T')[0] : ''}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^\d-]/g, '');
                  if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    setTuNgay(new Date(cleaned));
                    setPage(1);
                  } else if (v === '') {
                    setTuNgay(null);
                    setPage(1);
                  }
                }}
                placeholder="Từ ngày"
                placeholderTextColor={colors.stone[300]}
              />
            </View>
            <View style={styles.dateInputBox}>
              <Ionicons name="calendar-outline" size={16} color={colors.stone[400]} />
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
                placeholder="Đến ngày"
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
            <Ionicons name="call-outline" size={16} color={colors.stone[400]} />
            <TextInput
              style={styles.sdtInput}
              value={searchSdt}
              onChangeText={(v) => { setSearchSdt(v); setPage(1); }}
              placeholder="Tìm theo SĐT..."
              placeholderTextColor={colors.stone[400]}
              keyboardType="phone-pad"
            />
            {searchSdt.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchSdt(""); setPage(1); }}>
                <Ionicons name="close-circle" size={18} color={colors.stone[300]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Order count summary */}
      {data && !isLoading && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {data.data.length} đơn{data.totalPages > 1 ? ` (tổng ${data.totalPages} trang)` : ''}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !data?.data?.length ? (
        <EmptyState
          title="Không có đơn hàng"
          description={activeFilterCount > 0 ? "Thử thay đổi bộ lọc" : "Chưa có đơn hàng nào"}
        />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.blush} />}
          onEndReached={() => { if (page < (data?.totalPages ?? 1)) setPage(p => p + 1); }}
          ListFooterComponent={isFetching ? <LoadingSpinner size="sm" /> : null}
        />
      )}

      {/* Bulk status modal */}
      <Modal visible={bulkStatusModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBulkStatusModal(false)}>
          <View style={styles.modalOverlay} pointerEvents="none" />
        </TouchableOpacity>
        <View style={styles.modalContainer} pointerEvents={bulkStatusModal ? 'auto' : 'none'}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi trạng thái {selectedIds.length} đơn</Text>
            <View style={styles.statusGrid}>
              {ORDER_STATUSES.map(stt => (
                <TouchableOpacity
                  key={stt}
                  style={[styles.statusModalBtn, { borderColor: STATUS_COLORS[stt] }]}
                  onPress={() => { setBulkStatusModal(false); handleBulkStatus(stt); }}
                  activeOpacity={0.7}
                >
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
  pageHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}40`,
  },
  pageTitle: { fontSize: 18, fontWeight: '800' as const, color: colors.espresso },
  pageCount: { fontSize: 12, color: colors.stone[400], fontWeight: '500' as const },
  addOrderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.espresso, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.sm },
  addOrderBtnText: { fontSize: 12, fontWeight: '600', color: colors.cream },

  // Header
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}40`,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
    marginLeft: 8,
  },
  filterBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.espresso,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.white,
  },
  bulkBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
  },

  // Quick filters
  quickFilters: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}40`,
    paddingVertical: 10,
  },
  quickFiltersInner: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.stone[300],
    backgroundColor: colors.white,
    flexShrink: 0,
  },
  quickChipActive: {
    backgroundColor: colors.espresso,
    borderColor: colors.espresso,
  },
  quickChipText: {
    fontSize: 11,
    color: colors.stone[500],
    fontWeight: '500',
  },
  quickChipTextActive: {
    color: colors.cream,
    fontWeight: '600',
  },
  quickChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Bulk bar
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: `${colors.espresso}08`,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
  },
  bulkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulkText: { fontSize: 13, fontWeight: '700', color: colors.espresso },
  bulkActions: { flexDirection: 'row', gap: 8 },
  bulkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.stone[300],
    backgroundColor: colors.white,
  },
  bulkStatusBtn: {
    backgroundColor: colors.espresso,
    borderColor: colors.espresso,
  },
  bulkActionText: { fontSize: 11, fontWeight: '600', color: colors.espresso },
  bulkCloseBtn: {
    padding: 4,
  },

  // Filter panel
  filterPanel: {
    padding: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[100],
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    color: colors.espresso,
  },
  clearDateText: { fontSize: 12, color: colors.rose, fontWeight: '600' },
  sdtBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
  },
  sdtInput: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
  },

  // Count bar
  countBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cream,
  },
  countText: {
    fontSize: 11,
    color: colors.stone[400],
    fontWeight: '500',
  },

  // List
  list: { padding: 12, gap: 10, paddingBottom: 100 },

  // Order card
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardBulk: {
    paddingLeft: 44,
  },
  cardLeft: {
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.blush}08`,
    borderRightWidth: 1,
    borderRightColor: `${colors.stone[100]}60`,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.espresso,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.cream,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTop: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 10,
    color: colors.stone[400],
    fontFamily: "monospace",
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.espresso,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: colors.stone[400],
  },
  cardRight: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  total: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.espresso,
  },
  time: {
    fontSize: 10,
    color: colors.stone[300],
    marginTop: 2,
  },
  checkbox: {
    position: 'absolute',
    left: 12,
    top: 14,
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.stone[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.espresso,
    borderColor: colors.espresso,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    ...shadows.card,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.espresso,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  statusModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.stone[300],
    backgroundColor: colors.white,
    minWidth: '45%',
  },
  statusModalDot: { width: 8, height: 8, borderRadius: 4 },
  statusModalText: { fontSize: 12, fontWeight: '600', color: colors.espresso },
  
  // Thêm định nghĩa cho headerActions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
