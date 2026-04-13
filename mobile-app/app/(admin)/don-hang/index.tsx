import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders, updateOrderStatus } from "@/src/api/don-hang";
import { colors } from "@/src/theme";
import { LIMIT_DEFAULT, ORDER_STATUSES, STATUS_COLORS, STATUS_COLORS_BG } from "@/src/utils/constants";
import { formatMoney, formatRelativeTime } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import { Ionicons } from "@expo/vector-icons";

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTen, setSearchTen] = useState("");
  const [searchSdt, setSearchSdt] = useState("");
  const [trangThai, setTrangThai] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders", page, searchTen, searchSdt, trangThai],
    queryFn: () => getOrders({ page, limit: LIMIT_DEFAULT, search_ten: searchTen, search_sdt: searchSdt, trang_thai: trangThai }),
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/(admin)/don-hang/[id]", params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View>
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
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          value={searchTen}
          onChangeText={setSearchTen}
          placeholder="Tìm theo tên khách..."
          placeholderTextColor={colors.stone[400]}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
          <Ionicons name="options" size={20} color={colors.espresso} />
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterPanel}>
          <View style={styles.statusChips}>
            {ORDER_STATUSES.map(stt => (
              <TouchableOpacity key={stt} style={[styles.chip, trangThai === stt && styles.chipActive]}
                onPress={() => { setTrangThai(stt); setPage(1); }}>
                <Text style={[styles.chipText, trangThai === stt && styles.chipTextActive]}>{stt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.sdtInput}
            value={searchSdt}
            onChangeText={setSearchSdt}
            placeholder="Tìm theo SĐT..."
            placeholderTextColor={colors.stone[400]}
            keyboardType="phone-pad"
          />
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  searchInput: { flex: 1, backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.espresso },
  filterBtn: { padding: 10, backgroundColor: colors.cream, borderRadius: 8 },
  filterPanel: { padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  statusChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 10, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  sdtInput: { backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.espresso },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 10, color: colors.stone[400], fontFamily: "monospace" },
  customerName: { fontSize: 14, fontWeight: "600", color: colors.espresso, marginTop: 2 },
  phone: { fontSize: 12, color: colors.stone[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  total: { fontSize: 16, fontWeight: "700", color: colors.espresso },
  time: { fontSize: 11, color: colors.stone[400] },
});
