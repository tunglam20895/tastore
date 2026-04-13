import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder, updateOrderStatus } from "@/src/api/don-hang";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { ORDER_STATUSES, STATUS_COLORS, STATUS_COLORS_BG } from "@/src/utils/constants";
import { formatMoney, formatDate } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import Card from "@/src/components/ui/Card";
import Badge from "@/src/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role, staffTen } = useAuthStore();
  const isAdmin = role === "admin";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  const handleStatusChange = async (newStatus: string) => {
    if (data?.trangThai === newStatus) return;
    try {
      const nguoiXuLy = isAdmin ? "Admin" : (staffTen || "NV");
      await updateOrderStatus(id!, newStatus, nguoiXuLy);
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      refetch();
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  if (isLoading) return <LoadingSpinner size="full" label="Đang tải..." />;
  if (!data) return <View style={styles.center}><Text>Không tìm thấy đơn hàng</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      {/* Order info */}
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.orderId}>{data.id}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS_BG[data.trangThai] }]}>
            <Text style={[styles.statusPillText, { color: STATUS_COLORS[data.trangThai] }]}>{data.trangThai}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={colors.stone[400]} />
          <Text style={styles.infoText}>{data.tenKH}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color={colors.stone[400]} />
          <Text style={styles.infoText}>{data.sdt}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={colors.stone[400]} />
          <Text style={styles.infoText}>{data.diaChi}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color={colors.stone[400]} />
          <Text style={styles.infoText}>{formatDate(data.thoiGian)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalValue}>{formatMoney(data.tongTien)}</Text>
        </View>
        {data.maGiamGia && (
          <View style={styles.rowBetween}>
            <Text style={styles.couponLabel}>Mã giảm giá</Text>
            <Text style={styles.couponValue}>{data.maGiamGia} (-{formatMoney(data.giaTriGiam)})</Text>
          </View>
        )}
        <View style={styles.rowBetween}>
          <Text style={styles.staffLabel}>Người xử lý</Text>
          <Text style={styles.staffValue}>{data.nguoiXuLy}</Text>
        </View>
      </Card>

      {/* Products */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        {data.sanPham?.map((sp: any, i: number) => (
          <View key={i} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{sp.ten}</Text>
              {sp.sizeChon && <Text style={styles.productSize}>Size: {sp.sizeChon}</Text>}
              <Text style={styles.productQty}>x{sp.soLuong}</Text>
            </View>
            <Text style={styles.productPrice}>{formatMoney(sp.giaHienThi * sp.soLuong)}</Text>
          </View>
        ))}
      </Card>

      {/* Status buttons */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Cập nhật trạng thái</Text>
        <View style={styles.statusButtons}>
          {ORDER_STATUSES.map(stt => (
            <TouchableOpacity
              key={stt}
              style={[styles.statusBtn, data.trangThai === stt && styles.statusBtnActive, { borderColor: STATUS_COLORS[stt] || colors.stone[300] }]}
              onPress={() => handleStatusChange(stt)}
            >
              <Text style={[styles.statusBtnText, data.trangThai === stt && { color: colors.cream }]}>{stt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { marginHorizontal: 12, marginTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 12, color: colors.stone[400], fontFamily: "monospace" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  infoText: { fontSize: 14, color: colors.espresso },
  divider: { height: 1, backgroundColor: colors.stone[200], marginVertical: 12 },
  totalLabel: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.rose },
  couponLabel: { fontSize: 12, color: colors.stone[500] },
  couponValue: { fontSize: 12, color: colors.espresso, fontWeight: "600" },
  staffLabel: { fontSize: 12, color: colors.stone[500] },
  staffValue: { fontSize: 12, color: colors.espresso },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, color: colors.stone[500], marginBottom: 12 },
  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.stone[100] },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "500", color: colors.espresso },
  productSize: { fontSize: 11, color: colors.stone[400], marginTop: 2 },
  productQty: { fontSize: 11, color: colors.stone[400] },
  productPrice: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, backgroundColor: colors.white },
  statusBtnActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  statusBtnText: { fontSize: 10, fontWeight: "600", color: colors.stone[500] },
});
