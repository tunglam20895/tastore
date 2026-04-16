import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus, getOrder } from "@/src/api/don-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors, shadows, borderRadius } from "@/src/theme";
import { ORDER_STATUSES, STATUS_COLORS, STATUS_COLORS_BG } from "@/src/utils/constants";
import { formatMoney, formatDate } from "@/src/utils/format";
import AdminDetailHeader from "@/src/components/admin/AdminDetailHeader";
import { Ionicons } from "@expo/vector-icons";
import { showSuccess, showError } from "@/src/utils/toast";

const statusIcons: Record<string, string> = {
  "Mới": "document-outline",
  "Chốt để lên đơn": "clipboard-outline",
  "Đã lên đơn": "send-outline",
  "Đang xử lý": "time-outline",
  "Đã giao": "checkmark-circle-outline",
  "Huỷ": "close-circle-outline",
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, staffTen } = useAuthStore();
  const isAdmin = role === "admin";
  const [refreshing, setRefreshing] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Get id + cached data from params
  const params = useLocalSearchParams<{ id: string; cachedData?: string }>();
  const id = params?.id || "";
  const cached = params.cachedData ? (() => { try { return JSON.parse(params.cachedData!); } catch { return null; } })() : null;

  // Check if cached data is complete (has sanPham array = came from order list)
  // If not complete (came from notification), fetch from API
  const isCachedComplete = cached && Array.isArray(cached.sanPham);

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") return;
    if (isCachedComplete) {
      setOrderData(cached);
      return;
    }
    // Fetch full order from API (e.g. navigated from notification)
    const fetchOrder = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const result = await getOrder(id);
        setOrderData(result);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // data is the final resolved order data
  const data = orderData;

  const handleStatusChange = async (newStatus: string) => {
    if (!id || data?.trangThai === newStatus) return;
    try {
      const nguoiXuLy = isAdmin ? "Admin" : (staffTen || "NV");
      await updateOrderStatus(id, newStatus, nguoiXuLy);
      // Update local state optimistically
      setOrderData((prev: any) => prev ? { ...prev, trangThai: newStatus } : prev);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      showError("Không thể cập nhật trạng thái");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await getOrder(id);
      setOrderData(result);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      showError("Không thể tải lại đơn hàng");
    } finally {
      setRefreshing(false);
    }
  };

  // No valid ID
  if (!id || id === "undefined" || id === "null") {
    return (
      <View style={[styles.container, styles.center]}>
        <AdminDetailHeader title="Đơn hàng" showNotification onBack={router.back} />
        <View style={styles.centerContent}>
          <Ionicons name="receipt-outline" size={64} color={colors.stone[300]} />
          <Text style={styles.centerText}>Không tìm thấy mã đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state (fetching from API)
  if (loading) {
    return (
      <View style={styles.container}>
        <AdminDetailHeader title={`Đơn hàng #${id}`} showNotification onBack={router.back} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.blush} />
          <Text style={[styles.centerText, { marginTop: 12 }]}>Đang tải đơn hàng...</Text>
        </View>
      </View>
    );
  }

  // Fetch error
  if (fetchError) {
    return (
      <View style={styles.container}>
        <AdminDetailHeader title={`Đơn hàng #${id}`} showNotification onBack={router.back} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.rose} />
          <Text style={styles.centerText}>Không thể tải dữ liệu đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => { setFetchError(false); setLoading(true); getOrder(id).then(setOrderData).catch(() => setFetchError(true)).finally(() => setLoading(false)); }} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>↺ Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backButton, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.stone[300] }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.backButtonText, { color: colors.stone[500] }]}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No data available
  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <AdminDetailHeader title={`Đơn hàng #${id}`} showNotification onBack={router.back} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.rose} />
          <Text style={styles.centerText}>Không tìm thấy dữ liệu đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentStatusIdx = ORDER_STATUSES.indexOf(data.trangThai || "Mới");

  const safeData = {
    id: data.id || id,
    tenKH: data.tenKH || "—",
    sdt: data.sdt || "—",
    diaChi: data.diaChi || "—",
    thoiGian: data.thoiGian,
    tongTien: data.tongTien || 0,
    maGiamGia: data.maGiamGia,
    giaTriGiam: data.giaTriGiam || 0,
    nguoiXuLy: data.nguoiXuLy || "—",
    sanPham: data.sanPham || [],
    trangThai: data.trangThai || "Mới",
  };

  return (
    <View style={styles.container}>
      <AdminDetailHeader title={`Đơn hàng #${safeData.id}`} showNotification onBack={router.back} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blush} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Customer Info Card */}
        <View style={[styles.card, shadows.card]}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {safeData.tenKH !== "—" ? safeData.tenKH.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{safeData.tenKH}</Text>
              <View style={styles.customerMeta}>
                <Ionicons name="call" size={12} color={colors.stone[400]} />
                <Text style={styles.customerPhone}>{safeData.sdt}</Text>
              </View>
              <View style={styles.customerMeta}>
                <Ionicons name="location" size={12} color={colors.stone[400]} />
                <Text style={styles.customerAddress} numberOfLines={2}>{safeData.diaChi}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Order info grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mã đơn</Text>
              <Text style={styles.infoValue}>{safeData.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày đặt</Text>
              <Text style={styles.infoValue}>{safeData.thoiGian ? formatDate(safeData.thoiGian) : "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Người xử lý</Text>
              <Text style={styles.infoValue}>{safeData.nguoiXuLy}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mã giảm giá</Text>
              <Text style={styles.infoValue}>{safeData.maGiamGia ? `${safeData.maGiamGia} (-${formatMoney(safeData.giaTriGiam)})` : "Không"}</Text>
            </View>
          </View>

          {/* Total */}
          <View style={[styles.totalRow, shadows.card]}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatMoney(safeData.tongTien)}</Text>
          </View>
        </View>

        {/* Products List */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cube-outline" size={16} color={colors.blush} /> Sản phẩm ({safeData.sanPham.length})
          </Text>
          {safeData.sanPham.length === 0 ? (
            <Text style={styles.emptyText}>Không có sản phẩm trong đơn</Text>
          ) : (
            safeData.sanPham.map((sp: any, i: number) => (
              <View key={i} style={styles.productRow}>
                {/* Product Image */}
                {sp.anhURL ? (
                  <Image
                    source={{ uri: sp.anhURL }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Ionicons name="shirt-outline" size={20} color={colors.stone[300]} />
                  </View>
                )}
                <View style={styles.productQty}>
                  <Text style={styles.productQtyText}>x{sp.soLuong || 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{sp.ten || "—"}</Text>
                  {sp.sizeChon && (
                    <Text style={styles.productSize}>
                      <Ionicons name="resize-outline" size={10} color={colors.stone[400]} /> {sp.sizeChon}
                    </Text>
                  )}
                </View>
                <Text style={styles.productPrice}>{formatMoney((sp.giaHienThi || sp.gia || 0) * (sp.soLuong || 1))}</Text>
              </View>
            ))
          )}
        </View>

        {/* Status Progress */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="swap-horizontal" size={16} color={colors.blush} /> Trạng thái đơn hàng
          </Text>
          <View style={styles.statusProgress}>
            {ORDER_STATUSES.map((stt, i) => {
              const isActive = i <= currentStatusIdx;
              const isCurrent = i === currentStatusIdx;
              const color = STATUS_COLORS[stt] || colors.stone[300];
              return (
                <TouchableOpacity key={stt} style={styles.statusStep} onPress={() => handleStatusChange(stt)} activeOpacity={0.7}>
                  <View style={[styles.statusDot, isActive && { backgroundColor: color }, isCurrent && styles.statusDotCurrent]}>
                    {isCurrent && <Ionicons name="checkmark" size={12} color={colors.cream} />}
                  </View>
                  <Text style={[styles.statusStepText, isActive && { color }, isCurrent && { fontWeight: '700' }]} numberOfLines={1}>
                    {stt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.statusButtons}>
            {ORDER_STATUSES.map(stt => {
              const color = STATUS_COLORS[stt] || colors.stone[300];
              const isActive = safeData.trangThai === stt;
              return (
                <TouchableOpacity
                  key={stt}
                  style={[styles.statusBtn, isActive && styles.statusBtnActive, { borderColor: color, backgroundColor: isActive ? color : 'transparent' }]}
                  onPress={() => handleStatusChange(stt)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={(statusIcons[stt] || 'ellipse-outline') as any} size={14} color={isActive ? colors.cream : color} />
                  <Text style={[styles.statusBtnText, isActive && { color: colors.cream }]}>{stt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { justifyContent: "center", alignItems: "center" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  centerText: { fontSize: 14, color: colors.stone[400], marginTop: 12, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.stone[400], textAlign: 'center', padding: 20 },
  backButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.espresso, borderRadius: borderRadius.sm },
  backButtonText: { color: colors.cream, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 20, gap: 12 },

  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.espresso, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: 1, backgroundColor: colors.stone[100], marginVertical: 12 },

  customerHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  customerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.espresso, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  customerAvatarText: { fontSize: 15, fontWeight: '700', color: colors.cream },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', color: colors.espresso, marginBottom: 4 },
  customerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  customerPhone: { fontSize: 13, color: colors.stone[500] },
  customerAddress: { fontSize: 12, color: colors.stone[400], flex: 1 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { flex: 1, minWidth: '45%' },
  infoLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.stone[400], fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, color: colors.espresso, fontWeight: '600' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${colors.blush}10`, borderRadius: borderRadius.sm, padding: 14, marginTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.espresso },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.rose },

  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: `${colors.stone[100]}60`, gap: 10 },
  productImage: { width: 44, height: 44, borderRadius: 8, flexShrink: 0 },
  productImagePlaceholder: { backgroundColor: `${colors.stone[100]}80`, justifyContent: 'center', alignItems: 'center' },
  productQty: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.blush}15`, justifyContent: 'center', alignItems: 'center' },
  productQtyText: { fontSize: 12, fontWeight: '700', color: colors.blush },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: colors.espresso },
  productSize: { fontSize: 11, color: colors.stone[400], marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 2 },
  productPrice: { fontSize: 14, fontWeight: '700', color: colors.espresso, flexShrink: 0 },

  statusProgress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusStep: { alignItems: 'center', flex: 1, gap: 4 },
  statusDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.stone[200], justifyContent: 'center', alignItems: 'center', backgroundColor: colors.stone[100] },
  statusDotCurrent: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  statusStepText: { fontSize: 8, color: colors.stone[400], textAlign: 'center' },

  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.sm, borderWidth: 1.5 },
  statusBtnActive: {},
  statusBtnText: { fontSize: 10, fontWeight: '600', color: colors.stone[500] },
});
