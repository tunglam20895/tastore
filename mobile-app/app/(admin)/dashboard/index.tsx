import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiClient } from "@/src/api/client";
import { colors } from "@/src/theme";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { formatMoney, formatNumber } from "@/src/utils/format";

type ThongKe = {
  doanhThu: {
    homNay: number;
    thangNay: number;
    thangTruoc: number;
    tongCong: number;
    phanTramTangTruong: number | null;
  };
  donHang: {
    tongCong: number;
    homNay: number;
    moiChua: number;
    choTotLenDon: number;
    daLenDon: number;
    dangXuLy: number;
    daGiao: number;
    huy: number;
    tiLeHuy: number;
  };
  sanPham: {
    dangBan: number;
    hetHang: number;
  };
  tracking: {
    homNay: number;
    thangNay: number;
    tongCong: number;
  };
  nhanVien: {
    tongSo: number;
    conHoatDong: number;
    tongLuongChiTra: number;
  };
  khachHang: {
    tongSo: number;
    tongDoanhThu: number;
  };
};

function KpiCard({ label, value, sub, accent = colors.espresso }: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
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
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner size="full" label="Đang tải dữ liệu..." />;
  }

  const d = data;
  const growth = d?.doanhThu.phanTramTangTruong;
  const growthColor = growth == null ? colors.stone[400]
    : growth > 0 ? "#16A34A" : growth < 0 ? "#A8705F" : colors.stone[400];
  const growthText = growth == null ? "N/A" : growth > 0 ? `+${growth}%` : `${growth}%`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
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
        <KpiCard label="Lượt truy cập hôm nay" value={d ? formatNumber(d.tracking.homNay) : "—"} sub={`Tổng: ${d ? formatNumber(d.tracking.tongCong) : "—"}`} accent={colors.stone[400]} />
        <KpiCard label="SP đang bán" value={d ? formatNumber(d.sanPham.dangBan) : "—"} sub={`Hết hàng: ${d ? formatNumber(d.sanPham.hetHang) : "—"}`} accent={colors.stone[300]} />
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đơn hàng theo trạng thái</Text>
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
      </View>

      {/* Staff & salary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nhân viên & Lương</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatNumber(d?.nhanVien.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng nhân viên</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}15` }]}>
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.nhanVien.tongLuongChiTra) : "—"}</Text>
            <Text style={styles.summaryLabel}>Tổng lương</Text>
          </View>
        </View>
      </View>

      {/* Customers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khách hàng</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatNumber(d?.khachHang.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng khách hàng</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}15` }]}>
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.khachHang.tongDoanhThu) : "—"}</Text>
            <Text style={styles.summaryLabel}>Doanh thu từ KH</Text>
          </View>
        </View>
      </View>
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
  statCard: { width: "48%", backgroundColor: colors.white, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.stone[300] },
  statLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[600], marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: "700" },
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
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, backgroundColor: `${colors.blush}40`, borderRadius: 8, padding: 12, alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: colors.espresso },
  summaryLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[500], marginTop: 4 },
});
