import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, Alert, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, deleteProduct } from "@/src/api/san-pham";
import { getCategories } from "@/src/api/san-pham";
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { colors } from "@/src/theme";
import { formatMoney, formatNumber } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";

export default function ProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products", page, search, danhMuc],
    queryFn: () => getProducts({ page, limit: LIMIT_DEFAULT, search, danh_muc: danhMuc }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      Alert.alert("Thành công", "Đã xóa sản phẩm");
    } catch {
      Alert.alert("Lỗi", "Không thể xóa sản phẩm");
    } finally {
      setDeleteId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/(admin)/san-pham/[id]", params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.ten}</Text>
          {item.phanTramGiam && (
            <Text style={styles.discountBadge}>-{item.phanTramGiam}%</Text>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: "/(admin)/san-pham/[id]", params: { id: item.id } })}
          >
            <Ionicons name="pencil" size={16} color={colors.stone[400]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setDeleteId(item.id); setDeleteName(item.ten); }}
          >
            <Ionicons name="trash" size={16} color={colors.rose} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.price}>{formatMoney(item.giaHienThi)}</Text>
          {item.phanTramGiam && (
            <Text style={styles.oldPrice}>{formatMoney(item.giaGoc)}</Text>
          )}
        </View>
        <View style={styles.stockBadge}>
          <Text style={[styles.stockText, {
            color: item.soLuong === 0 ? "#DC2626" : item.soLuong <= 30 ? colors.rose : "#16A34A"
          }]}>
            {item.soLuong === 0 ? "Hết hàng" : `Kho: ${formatNumber(item.soLuong)}`}
          </Text>
        </View>
      </View>
      {item.sizes && item.sizes.length > 0 && (
        <View style={styles.sizesRow}>
          {item.sizes.slice(0, 6).map((s: any, i: number) => (
            <Text key={i} style={styles.sizeTag}>{s.ten}({s.soLuong})</Text>
          ))}
          {item.sizes.length > 6 && <Text style={styles.sizeTag}>+{item.sizes.length - 6}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search & Add */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.stone[400]} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm sản phẩm..."
              placeholderTextColor={colors.stone[400]}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
            <Ionicons name="options" size={20} color={colors.espresso} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(admin)/san-pham/add")}
          >
            <Ionicons name="add" size={20} color={colors.cream} />
          </TouchableOpacity>
        </View>

        {/* Filter dropdown */}
        {showFilter && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Danh mục</Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[styles.chip, !danhMuc && styles.chipActive]}
                onPress={() => { setDanhMuc(""); setPage(1); }}
              >
                <Text style={[styles.chipText, !danhMuc && styles.chipTextActive]}>Tất cả</Text>
              </TouchableOpacity>
              {(categories as any)?.data?.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, danhMuc === c.id && styles.chipActive]}
                  onPress={() => { setDanhMuc(c.id); setPage(1); }}
                >
                  <Text style={[styles.chipText, danhMuc === c.id && styles.chipTextActive]}>
                    {c.tenDanhMuc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* List */}
      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !data?.data?.length ? (
        <EmptyState title="Chưa có sản phẩm" description="Nhấn + để thêm sản phẩm mới" />
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
          }
          onEndReached={() => {
            if (page < (data?.totalPages ?? 1)) setPage((p) => p + 1);
          }}
          ListFooterComponent={
            isFetching ? <LoadingSpinner size="sm" /> : null
          }
        />
      )}

      <ConfirmDialog
        visible={!!deleteId}
        title="Xóa sản phẩm?"
        message={`Bạn có chắc muốn xóa "${deleteName}"?`}
        confirmText="Xóa"
        isDanger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
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
  addBtn: { padding: 10, backgroundColor: colors.espresso, borderRadius: 8 },
  filterPanel: { marginTop: 12 },
  filterLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[600], marginBottom: 8, fontWeight: "600" },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300], backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  chipText: { fontSize: 11, color: colors.stone[500] },
  chipTextActive: { color: colors.cream },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.espresso, flex: 1 },
  discountBadge: { fontSize: 10, color: colors.rose, fontWeight: "600", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 4 },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  price: { fontSize: 16, fontWeight: "700", color: colors.espresso },
  oldPrice: { fontSize: 11, color: colors.stone[400], textDecorationLine: "line-through" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.cream },
  stockText: { fontSize: 11, fontWeight: "600" },
  sizesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  sizeTag: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.stone[200], color: colors.stone[500] },
});
