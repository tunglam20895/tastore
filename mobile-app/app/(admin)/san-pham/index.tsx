import React, { useCallback, useState } from "react";
import { useDebounce } from "@/src/hooks/useDebounce";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, Modal, ScrollView, SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { TopAppBar } from "@/src/components/ui/TopAppBar";
import { useRequireQuyen } from "@/src/hooks/useRequireQuyen";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, deleteProduct } from "@/src/api/san-pham";
import { getCategories } from "@/src/api/san-pham";
import { LIMIT_DEFAULT } from "@/src/utils/constants";
import { shadows, borderRadius } from "@/src/theme";
import { legacyColors } from "@/src/theme/legacy-colors";
import { formatMoney, formatNumber } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";

const IMAGE_W = 70;

export default function ProductsScreen() {
  useRequireQuyen('san-pham');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [danhMuc, setDanhMuc] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [showFilter, setShowFilter] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["products", page, debouncedSearch, danhMuc],
    queryFn: () => getProducts({ page, limit: LIMIT_DEFAULT, search: debouncedSearch, danh_muc: danhMuc }),
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
      showSuccess("Đã xóa sản phẩm");
    } catch {
      showError("Không thể xóa sản phẩm");
    } finally {
      setDeleteId(null);
    }
  };

  const getStockLabel = (soLuong: number) => {
    if (soLuong === 0) return { text: "Hết hàng", color: legacyColors.danger, bg: `${legacyColors.danger}12` };
    if (soLuong <= 30) return { text: `Còn ${soLuong}`, color: legacyColors.rose, bg: `${legacyColors.rose}12` };
    return { text: `Còn ${soLuong}`, color: legacyColors.success, bg: `${legacyColors.success}12` };
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const stock = getStockLabel(item.soLuong || 0);
    const stockColor = item.soLuong === 0 ? legacyColors.danger : item.soLuong <= 30 ? legacyColors.rose : legacyColors.success;
    return (
      <TouchableOpacity
        style={[styles.card, shadows.card]}
        onPress={() => {
          router.push({
            pathname: "/(admin)/san-pham/[id]",
            params: { id: item.id, cachedData: JSON.stringify(item) },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.cardAccent, { backgroundColor: stockColor }]} />

        {item.anhURL ? (
          <Image
            source={{ uri: item.anhURL }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color={legacyColors.stone[300]} />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.ten}</Text>
              {item.danhMuc && (
                <Text style={styles.categoryBadge}>{item.danhMuc}</Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push({
                  pathname: "/(admin)/san-pham/[id]",
                  params: { id: item.id, cachedData: JSON.stringify(item) },
                })}
              >
                <Ionicons name="pencil-outline" size={16} color={legacyColors.stone[400]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { setDeleteId(item.id); setDeleteName(item.ten); }}
              >
                <Ionicons name="trash-outline" size={16} color={legacyColors.rose} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View>
              <Text style={styles.price}>{formatMoney(item.giaHienThi || item.giaGoc || 0)}</Text>
              {item.phanTramGiam ? (
                <View style={styles.discountRow}>
                  <Text style={styles.oldPrice}>{formatMoney(item.giaGoc || 0)}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{item.phanTramGiam}%</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noDiscountSpacer} />
              )}
            </View>
            <View style={[styles.stockBadge, { backgroundColor: stock.bg }]}>
              <View style={[styles.stockDot, { backgroundColor: stock.color }]} />
              <Text style={[styles.stockText, { color: stock.color }]}>{stock.text}</Text>
            </View>
          </View>

          {item.sizes && item.sizes.length > 0 && (
            <View style={styles.sizesRow}>
              {item.sizes.slice(0, 6).map((s: any, i: number) => (
                <View key={i} style={styles.sizeTag}>
                  <Text style={styles.sizeTagText}>{s.ten}({s.soLuong})</Text>
                </View>
              ))}
              {item.sizes.length > 6 && (
                <View style={styles.sizeTag}>
                  <Text style={styles.sizeTagText}>+{item.sizes.length - 6}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar title="TRANG ANH" showMenu showNotifications />
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={legacyColors.stone[400]} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={(v) => { setSearch(v); setPage(1); }}
              placeholder="Tìm sản phẩm..."
              placeholderTextColor={legacyColors.stone[400]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={legacyColors.stone[300]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color={legacyColors.espresso} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(admin)/san-pham/add")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={legacyColors.cream} />
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
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
            </ScrollView>
          </View>
        )}
      </View>

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
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={legacyColors.blush} />
          }
          onEndReached={() => {
            if (page < (data?.totalPages ?? 1)) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.3}
          windowSize={10}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: legacyColors.cream },
  header: {
    backgroundColor: legacyColors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${legacyColors.stone[200]}40`,
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
    backgroundColor: legacyColors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: legacyColors.espresso,
    marginLeft: 8,
  },
  clearBtn: {
    padding: 2,
  },
  filterBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: legacyColors.cream,
    borderRadius: borderRadius.sm,
  },
  addBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: legacyColors.espresso,
    borderRadius: borderRadius.sm,
  },
  filterPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: legacyColors.stone[600],
    marginBottom: 8,
    fontWeight: "600",
  },
  filterChips: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: legacyColors.stone[300],
    backgroundColor: legacyColors.white,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: legacyColors.espresso,
    borderColor: legacyColors.espresso,
  },
  chipText: { fontSize: 11, color: legacyColors.stone[500], fontWeight: '500' },
  chipTextActive: { color: legacyColors.cream, fontWeight: '600' },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  card: {
    backgroundColor: legacyColors.white,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  productImage: {
    width: IMAGE_W,
    height: IMAGE_W,
    flexShrink: 0,
  },
  productImagePlaceholder: {
    backgroundColor: `${legacyColors.stone[100]}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: legacyColors.espresso,
  },
  categoryBadge: {
    fontSize: 10,
    color: legacyColors.blush,
    fontWeight: '600',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: `${legacyColors.stone[100]}80`,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: legacyColors.espresso,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  oldPrice: {
    fontSize: 11,
    color: legacyColors.stone[400],
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: `${legacyColors.rose}15`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    color: legacyColors.rose,
    fontWeight: "700",
  },
  noDiscountSpacer: { height: 16 },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sizesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  sizeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${legacyColors.stone[200]}80`,
    backgroundColor: `${legacyColors.stone[100]}40`,
  },
  sizeTagText: {
    fontSize: 10,
    color: legacyColors.stone[500],
    fontWeight: '500',
  },
});
