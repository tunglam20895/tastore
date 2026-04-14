import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiClient } from "@/src/api/client";
import { colors } from "@/src/theme";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { formatMoney, formatNumber } from "@/src/utils/format";
import { BarChart, LineChart } from "react-native-gifted-charts";

type ThongKe = {
  doanhThu: {
    homNay: number; thangNay: number; thangTruoc: number; tongCong: number;
    phanTramTangTruong: number | null;
  };
  donHang: {
    tongCong: number; homNay: number; moiChua: number; choTotLenDon: number;
    daLenDon: number; dangXuLy: number; daGiao: number; huy: number; tiLeHuy: number;
  };
  sanPham: {
    dangBan: number; hetHang: number;
    topBanChay?: Array<{ ten: string; soLuong: number }>;
    topDanhMuc?: Array<{ ten: string; soLuong: number }>;
  };
  tracking: {
    homNay: number; thangNay: number; tongCong: number;
    last7Days?: Array<{ date: string; count: number }>;
  };
  donTheoNhanVien?: Array<{ ten: string; soDon: number; doanhThu: number }>;
  nhanVien: {
    tongSo: number; conHoatDong: number; tongLuongChiTra: number;
  };
  khachHang: {
    tongSo: number; tongDoanhThu: number;
    topKhachHang?: Array<{ ten: string; tongDon: number; tongDoanhThu: number }>;
  };
  donHang7Ngay?: Array<{ date: string; count: number }>;
};

function KpiCard({ label, value, sub, accent = colors.espresso }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderTopWidth: 3, borderTopColor: accent }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function StatCard({ label, value, color = colors.espresso }: {
  label: string; value: string; color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function DashboardScreen() {
  const [data, setData] = useState<ThongKe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiClient.get("/api/thong-ke");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  if (loading && !data) {
    return <LoadingSpinner size="full" label="Đang tải dữ liệu..." />;
  }

  const d = data;
  const growth = d?.doanhThu.phanTramTangTruong;
  const growthColor = growth == null ? colors.stone[400]
    : growth > 0 ? "#16A34A" : growth < 0 ? "#A8705F" : colors.stone[400];
  const growthText = growth == null ? "N/A" : growth > 0 ? `+${growth}%` : `${growth}%`;

  // Prepare chart data
  const trackingData = d?.tracking?.last7Days?.map(item => ({
    value: item.count,
    label: item.date.slice(5), // MM-DD
    frontColor: colors.blush,
  })) || [];

  const orderData = d?.donHang7Ngay?.map(item => ({
    value: item.count,
    label: item.date.slice(5),
    frontColor: colors.espresso,
  })) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KpiCard label="Doanh thu tháng" value={d ? formatMoney(d.doanhThu.thangNay) : "—"} sub={`Tháng trước: ${d ? formatMoney(d.doanhThu.thangTruoc) : "—"}`} accent={colors.espresso} />
        <KpiCard label="Đơn hôm nay" value={d ? formatNumber(d.donHang.homNay) : "—"} sub={`Tổng: ${d ? formatNumber(d.donHang.tongCong) : "—"} đơn`} accent={colors.rose} />
        <KpiCard label="Lượt truy cập" value={d ? formatNumber(d.tracking.homNay) : "—"} sub={`Hôm nay`} accent={colors.stone[400]} />
        <KpiCard label="SP đang bán" value={d ? formatNumber(d.sanPham.dangBan) : "—"} sub={`Hết: ${d ? formatNumber(d.sanPham.hetHang) : "—"}`} accent={colors.stone[300]} />
      </View>

      {/* Small stats */}
      <View style={styles.statGrid}>
        <StatCard label="Hôm nay" value={d ? formatMoney(d.doanhThu.homNay) : "—"} />
        <StatCard label="Tăng trưởng" value={growthText} color={growthColor} />
        <StatCard label="Tổng doanh thu" value={d ? formatMoney(d.doanhThu.tongCong) : "—"} />
        <StatCard label="Đơn mới" value={d ? formatNumber(d.donHang.moiChua) : "—"} color="#2563EB" />
        <StatCard label="Chốt lên đơn" value={d ? formatNumber(d.donHang.choTotLenDon) : "—"} color="#8B5CF6" />
        <StatCard label="Đang xử lý" value={d ? formatNumber(d.donHang.dangXuLy) : "—"} color="#D97706" />
      </View>

      {/* Order statuses */}
      <Section title="Đơn hàng theo trạng thái">
        {d && [
          { label: "Mới", count: d.donHang.moiChua, color: "#3B82F6" },
          { label: "Chốt lên đơn", count: d.donHang.choTotLenDon, color: "#8B5CF6" },
          { label: "Đã lên đơn", count: d.donHang.daLenDon, color: "#14B8A6" },
          { label: "Đang xử lý", count: d.donHang.dangXuLy, color: "#F59E0B" },
          { label: "Đã giao", count: d.donHang.daGiao, color: "#22C55E" },
          { label: "Huỷ", count: d.donHang.huy, color: colors.rose },
        ].map((s, i) => {
          const max = Math.max(1, d.donHang.moiChua, d.donHang.choTotLenDon, d.donHang.daLenDon, d.donHang.dangXuLy, d.donHang.daGiao, d.donHang.huy);
          const pct = Math.round((s.count / max) * 100);
          return (
            <View key={i} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: s.color }]} />
              <View style={styles.statusInfo}>
                <View style={styles.statusRowInner}>
                  <Text style={styles.statusLabel}>{s.label}</Text>
                  <Text style={[styles.statusCount, { color: s.color }]}>{formatNumber(s.count)}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
              </View>
            </View>
          );
        })}
      </Section>

      {/* Charts - Tracking 7 days */}
      {trackingData.length > 0 && (
        <Section title="Lượt truy cập 7 ngày">
          <View style={styles.chartContainer}>
            <BarChart
              data={trackingData}
              barWidth={20}
              spacing={20}
              roundedTop
              roundedBottom
              hideRules
              hideYAxisText
              yAxisColor={colors.stone[200]}
              xAxisColor={colors.stone[200]}
              noOfSections={3}
              backgroundColor={colors.white}
              labelWidth={40}
              initialSpacing={10}
            />
          </View>
        </Section>
      )}

      {/* Charts - Orders 7 days */}
      {orderData.length > 0 && (
        <Section title="Đơn hàng 7 ngày">
          <View style={styles.chartContainer}>
            <BarChart
              data={orderData}
              barWidth={20}
              spacing={20}
              roundedTop
              roundedBottom
              hideRules
              hideYAxisText
              yAxisColor={colors.stone[200]}
              xAxisColor={colors.stone[200]}
              noOfSections={3}
              backgroundColor={colors.white}
              labelWidth={40}
              initialSpacing={10}
            />
          </View>
        </Section>
      )}

      {/* Top sản phẩm bán chạy */}
      {d?.sanPham?.topBanChay && d.sanPham.topBanChay.length > 0 && (
        <Section title="Top sản phẩm bán chạy">
          {d.sanPham.topBanChay.slice(0, 5).map((sp, i) => {
            const max = d.sanPham.topBanChay![0]?.soLuong || 1;
            const pct = Math.round((sp.soLuong / max) * 100);
            return (
              <View key={i} style={styles.topItemRow}>
                <Text style={styles.topRank}>#{i + 1}</Text>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName} numberOfLines={1}>{sp.ten}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: colors.blush }]} />
                  </View>
                </View>
                <Text style={styles.topItemCount}>{formatNumber(sp.soLuong)}</Text>
              </View>
            );
          })}
        </Section>
      )}

      {/* Top danh mục */}
      {d?.sanPham?.topDanhMuc && d.sanPham.topDanhMuc.length > 0 && (
        <Section title="Top danh mục">
          {d.sanPham.topDanhMuc.slice(0, 5).map((dm, i) => {
            const max = d.sanPham.topDanhMuc![0]?.soLuong || 1;
            const pct = Math.round((dm.soLuong / max) * 100);
            return (
              <View key={i} style={styles.topItemRow}>
                <Text style={styles.topRank}>#{i + 1}</Text>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName} numberOfLines={1}>{dm.ten}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: colors.rose }]} />
                  </View>
                </View>
                <Text style={styles.topItemCount}>{formatNumber(dm.soLuong)}</Text>
              </View>
            );
          })}
        </Section>
      )}

      {/* Đơn hàng theo nhân viên */}
      {d?.donTheoNhanVien && d.donTheoNhanVien.length > 0 && (
        <Section title="Đơn hàng theo nhân viên">
          {d.donTheoNhanVien.map((nv, i) => {
            const max = Math.max(1, ...d.donTheoNhanVien!.map(n => n.soDon));
            const pct = Math.round((nv.soDon / max) * 100);
            return (
              <View key={i} style={styles.staffRow}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{nv.ten.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{nv.ten}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: colors.espresso }]} />
                  </View>
                </View>
                <View style={styles.staffStats}>
                  <Text style={styles.staffDonCount}>{formatNumber(nv.soDon)} đơn</Text>
                  <Text style={styles.staffDoanhThu}>{formatMoney(nv.doanhThu)}</Text>
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* Top khách hàng */}
      {d?.khachHang?.topKhachHang && d.khachHang.topKhachHang.length > 0 && (
        <Section title="Top khách hàng">
          {d.khachHang.topKhachHang.slice(0, 5).map((kh, i) => (
            <View key={i} style={styles.customerRow}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{kh.ten}</Text>
                <Text style={styles.customerDon}>{formatNumber(kh.tongDon)} đơn</Text>
              </View>
              <Text style={styles.customerDoanhThu}>{formatMoney(kh.tongDoanhThu)}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Staff & salary */}
      <Section title="Nhân viên & Lương">
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatNumber(d?.nhanVien.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng NV</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}15` }]}>
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.nhanVien.tongLuongChiTra) : "—"}</Text>
            <Text style={styles.summaryLabel}>Tổng lương</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.blush}20` }]}>
            <Text style={[styles.summaryValue, { color: colors.blush }]}>{formatNumber(d?.nhanVien.conHoatDong ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Đang HĐ</Text>
          </View>
        </View>
      </Section>

      {/* Customers */}
      <Section title="Khách hàng">
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatNumber(d?.khachHang.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng KH</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}15` }]}>
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.khachHang.tongDoanhThu) : "—"}</Text>
            <Text style={styles.summaryLabel}>Doanh thu từ KH</Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "300", letterSpacing: 2, color: colors.espresso },
  refreshText: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.stone[400] },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCard: { flex: 1, minWidth: "47%", backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  kpiLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: colors.stone[500], marginBottom: 6 },
  kpiValue: { fontSize: 18, fontWeight: "700", color: colors.espresso },
  kpiSub: { fontSize: 10, color: colors.stone[500], marginTop: 4 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  statCard: { width: "31%", backgroundColor: colors.white, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.stone[300] },
  statLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[600], marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: "700" },
  section: { marginTop: 20, backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.stone[300] },
  sectionTitle: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.stone[500], marginBottom: 12, fontWeight: "500" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusInfo: { flex: 1 },
  statusRowInner: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  statusLabel: { fontSize: 12, fontWeight: "500", color: colors.espresso },
  statusCount: { fontSize: 12, fontWeight: "600" },
  progressBarBg: { height: 6, backgroundColor: `${colors.blush}30`, borderRadius: 3 },
  progressBar: { height: 6, borderRadius: 3 },
  chartContainer: { padding: 8, minHeight: 200 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, backgroundColor: `${colors.blush}40`, borderRadius: 8, padding: 12, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "700", color: colors.espresso },
  summaryLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[500], marginTop: 4 },
  // Top items
  topItemRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  topRank: { fontSize: 12, fontWeight: "700", color: colors.rose, width: 24 },
  topItemInfo: { flex: 1 },
  topItemName: { fontSize: 13, fontWeight: "500", color: colors.espresso, marginBottom: 4 },
  topItemCount: { fontSize: 12, fontWeight: "600", color: colors.stone[500] },
  // Staff rows
  staffRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  staffAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.espresso, justifyContent: "center", alignItems: "center" },
  staffAvatarText: { fontSize: 14, fontWeight: "700", color: colors.cream },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: "600", color: colors.espresso, marginBottom: 4 },
  staffStats: { alignItems: "flex-end" },
  staffDonCount: { fontSize: 11, color: colors.stone[500] },
  staffDoanhThu: { fontSize: 12, fontWeight: "600", color: colors.espresso },
  // Customer rows
  customerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.stone[100] },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 13, fontWeight: "600", color: colors.espresso },
  customerDon: { fontSize: 11, color: colors.stone[400] },
  customerDoanhThu: { fontSize: 13, fontWeight: "700", color: colors.rose },
});
