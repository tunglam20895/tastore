import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Dimensions, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiClient } from "@/src/api/client";
import { colors, shadows, borderRadius } from "@/src/theme";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import { formatMoney, formatNumber } from "@/src/utils/format";
import { BarChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";

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

// Quick stat mini card (inline top bar)
function QuickStat({ icon, value, label, iconColor }: {
  icon: string; value: string; label: string; iconColor: string;
}) {
  return (
    <View style={styles.quickStat}>
      <View style={[styles.quickStatIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={16} color={iconColor} />
      </View>
      <View style={styles.quickStatText}>
        <Text style={styles.quickStatValue}>{value}</Text>
        <Text style={styles.quickStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

// KPI Card with shadow and gradient accent
function KpiCard({ label, value, sub, icon, accent = colors.espresso }: {
  label: string; value: string; sub?: string; icon: string; accent?: string;
}) {
  return (
    <View style={[styles.kpiCard, styles.cardShadow]}>
      <View style={[styles.kpiAccent, { backgroundColor: accent }]} />
      <View style={[styles.kpiIconWrap, { backgroundColor: `${accent}12` }]}>
        <Ionicons name={icon as any} size={18} color={accent} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function StatCard({ label, value, color = colors.espresso, icon }: {
  label: string; value: string; color?: string; icon: string;
}) {
  return (
    <View style={[styles.statCard, styles.cardShadow]}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={[styles.section, styles.cardShadow]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon as any} size={16} color={colors.blush} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
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
  const growthIcon = growth == null ? "remove-outline" : growth > 0 ? "trending-up" : "trending-down";
  const growthText = growth == null ? "N/A" : growth > 0 ? `+${growth}%` : `${growth}%`;

  // Prepare chart data
  const trackingData = d?.tracking?.last7Days?.map(item => ({
    value: item.count,
    label: item.date.slice(5),
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blush} />}
    >
      {/* Quick Stats Bar */}
      <View style={styles.quickStatsBar}>
        <QuickStat icon="cash" value={d ? formatMoney(d.doanhThu.homNay) : "—"} label="Hôm nay" iconColor={colors.espresso} />
        <QuickStat icon="trending-up" value={growthText} label="Tăng trưởng" iconColor={growthColor} />
        <QuickStat icon="cash-outline" value={d ? formatMoney(d.doanhThu.tongCong) : "—"} label="Tổng DT" iconColor={colors.blush} />
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <KpiCard label="Doanh thu tháng" value={d ? formatMoney(d.doanhThu.thangNay) : "—"} sub={`Tháng trước: ${d ? formatMoney(d.doanhThu.thangTruoc) : "—"}`} icon="cash" accent={colors.espresso} />
        <KpiCard label="Đơn hôm nay" value={d ? formatNumber(d.donHang.homNay) : "—"} sub={`Tổng: ${d ? formatNumber(d.donHang.tongCong) : "—"} đơn`} icon="cube" accent={colors.rose} />
        <KpiCard label="Lượt truy cập" value={d ? formatNumber(d.tracking.homNay) : "—"} sub={`Hôm nay`} icon="eye" accent={colors.stone[500]} />
        <KpiCard label="SP đang bán" value={d ? formatNumber(d.sanPham.dangBan) : "—"} sub={`Hết: ${d ? formatNumber(d.sanPham.hetHang) : "—"}`} icon="shirt" accent={colors.stone[400]} />
      </View>

      {/* Order status cards */}
      <View style={styles.statGrid}>
        <StatCard label="Đơn mới" value={d ? formatNumber(d.donHang.moiChua) : "—"} color="#2563EB" icon="document-outline" />
        <StatCard label="Chốt lên đơn" value={d ? formatNumber(d.donHang.choTotLenDon) : "—"} color="#8B5CF6" icon="clipboard-outline" />
        <StatCard label="Đang xử lý" value={d ? formatNumber(d.donHang.dangXuLy) : "—"} color="#D97706" icon="time-outline" />
        <StatCard label="Đã giao" value={d ? formatNumber(d.donHang.daGiao) : "—"} color="#22C55E" icon="checkmark-circle-outline" />
        <StatCard label="Huỷ" value={d ? formatNumber(d.donHang.huy) : "—"} color={colors.rose} icon="close-circle-outline" />
      </View>

      {/* Order statuses with progress bars */}
      <Section title="Đơn hàng theo trạng thái" icon="bar-chart">
        {d && [
          { label: "Mới", count: d.donHang.moiChua, color: "#3B82F6", icon: "document-outline" },
          { label: "Chốt lên đơn", count: d.donHang.choTotLenDon, color: "#8B5CF6", icon: "clipboard-outline" },
          { label: "Đã lên đơn", count: d.donHang.daLenDon, color: "#14B8A6", icon: "send-outline" },
          { label: "Đang xử lý", count: d.donHang.dangXuLy, color: "#F59E0B", icon: "time-outline" },
          { label: "Đã giao", count: d.donHang.daGiao, color: "#22C55E", icon: "checkmark-circle-outline" },
          { label: "Huỷ", count: d.donHang.huy, color: colors.rose, icon: "close-circle-outline" },
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
        <Section title="Lượt truy cập 7 ngày" icon="bar-chart-outline">
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
              backgroundColor="transparent"
              labelWidth={40}
              initialSpacing={10}
            />
          </View>
        </Section>
      )}

      {/* Charts - Orders 7 days */}
      {orderData.length > 0 && (
        <Section title="Đơn hàng 7 ngày" icon="cart-outline">
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
              backgroundColor="transparent"
              labelWidth={40}
              initialSpacing={10}
            />
          </View>
        </Section>
      )}

      {/* Top sản phẩm bán chạy */}
      {d?.sanPham?.topBanChay && d.sanPham.topBanChay.length > 0 && (
        <Section title="Top sản phẩm bán chạy" icon="flame">
          {d.sanPham.topBanChay.slice(0, 5).map((sp, i) => {
            const max = d.sanPham.topBanChay![0]?.soLuong || 1;
            const pct = Math.round((sp.soLuong / max) * 100);
            const medalColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : colors.stone[300];
            return (
              <View key={i} style={styles.topItemRow}>
                <View style={[styles.topRankBadge, { backgroundColor: `${medalColor}20` }]}>
                  <Text style={[styles.topRank, { color: medalColor }]}>#{i + 1}</Text>
                </View>
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
        <Section title="Top danh mục" icon="pricetags">
          {d.sanPham.topDanhMuc.slice(0, 5).map((dm, i) => {
            const max = d.sanPham.topDanhMuc![0]?.soLuong || 1;
            const pct = Math.round((dm.soLuong / max) * 100);
            return (
              <View key={i} style={styles.topItemRow}>
                <View style={[styles.topRankBadge, { backgroundColor: `${colors.rose}15` }]}>
                  <Text style={[styles.topRank, { color: colors.rose }]}>#{i + 1}</Text>
                </View>
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
        <Section title="Đơn hàng theo nhân viên" icon="people">
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
        <Section title="Top khách hàng" icon="heart">
          {d.khachHang.topKhachHang.slice(0, 5).map((kh, i) => (
            <View key={i} style={styles.customerRow}>
              <View style={[styles.topRankBadge, { backgroundColor: `${colors.blush}15` }]}>
                <Text style={[styles.topRank, { color: colors.blush }]}>#{i + 1}</Text>
              </View>
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
      <Section title="Nhân viên & Lương" icon="wallet">
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.blush}12` }]}>
            <Ionicons name="people-outline" size={20} color={colors.espresso} />
            <Text style={styles.summaryValue}>{formatNumber(d?.nhanVien.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng NV</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}10` }]}>
            <Ionicons name="cash-outline" size={20} color={colors.rose} />
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.nhanVien.tongLuongChiTra) : "—"}</Text>
            <Text style={styles.summaryLabel}>Tổng lương</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.blush}15` }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.blush} />
            <Text style={[styles.summaryValue, { color: colors.blush }]}>{formatNumber(d?.nhanVien.conHoatDong ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Đang HĐ</Text>
          </View>
        </View>
      </Section>

      {/* Customers */}
      <Section title="Khách hàng" icon="happy-outline">
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.blush}12` }]}>
            <Ionicons name="person-outline" size={20} color={colors.espresso} />
            <Text style={styles.summaryValue}>{formatNumber(d?.khachHang.tongSo ?? 0)}</Text>
            <Text style={styles.summaryLabel}>Tổng KH</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.rose}10` }]}>
            <Ionicons name="cart-outline" size={20} color={colors.rose} />
            <Text style={[styles.summaryValue, { color: colors.rose }]}>{d ? formatMoney(d.khachHang.tongDoanhThu) : "—"}</Text>
            <Text style={styles.summaryLabel}>Doanh thu KH</Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 12, paddingBottom: 100 },

  // Quick stats bar
  quickStatsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 12,
    ...shadows.card,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatText: { flex: 1 },
  quickStatValue: { fontSize: 12, fontWeight: '700', color: colors.espresso },
  quickStatLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.stone[400] },

  // KPI Cards
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 14,
    position: "relative",
    overflow: "hidden",
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.stone[500], marginBottom: 4, fontWeight: '500' },
  kpiValue: { fontSize: 17, fontWeight: "800" },
  kpiSub: { fontSize: 10, color: colors.stone[500], marginTop: 4 },

  // Stat cards
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  statCard: {
    width: "31%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 14, fontWeight: "800" },
  statLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: colors.stone[500], fontWeight: '500' },

  // Sections
  section: { marginTop: 16, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: 16, overflow: 'hidden' },
  sectionHeader: { marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: colors.espresso, fontWeight: "700" },

  // Status rows
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusInfo: { flex: 1 },
  statusRowInner: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  statusLabel: { fontSize: 13, fontWeight: "600", color: colors.espresso },
  statusCount: { fontSize: 13, fontWeight: "700" },
  progressBarBg: { height: 6, backgroundColor: `${colors.stone[200]}50`, borderRadius: 3 },
  progressBar: { height: 6, borderRadius: 3 },

  // Charts
  chartContainer: { padding: 8, minHeight: 180 },

  // Summary cards
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: {
    flex: 1,
    borderRadius: borderRadius.sm,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  summaryValue: { fontSize: 15, fontWeight: "800", color: colors.espresso },
  summaryLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: colors.stone[500], fontWeight: '500' },

  // Top items
  topItemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  topRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRank: { fontSize: 11, fontWeight: "800" },
  topItemInfo: { flex: 1 },
  topItemName: { fontSize: 13, fontWeight: "600", color: colors.espresso, marginBottom: 5 },
  topItemCount: { fontSize: 13, fontWeight: "700", color: colors.stone[500] },

  // Staff rows
  staffRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  staffAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.espresso, justifyContent: "center", alignItems: "center" },
  staffAvatarText: { fontSize: 13, fontWeight: "700", color: colors.cream },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: "600", color: colors.espresso, marginBottom: 4 },
  staffStats: { alignItems: "flex-end" },
  staffDonCount: { fontSize: 11, color: colors.stone[500] },
  staffDoanhThu: { fontSize: 12, fontWeight: "700", color: colors.espresso },

  // Customer rows
  customerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: `${colors.stone[100]}80` },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 13, fontWeight: "600", color: colors.espresso },
  customerDon: { fontSize: 11, color: colors.stone[400] },
  customerDoanhThu: { fontSize: 13, fontWeight: "700", color: colors.rose },
});
