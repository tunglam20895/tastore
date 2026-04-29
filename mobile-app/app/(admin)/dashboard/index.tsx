import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TopAppBar } from '../../../src/components/ui/TopAppBar';
import { StatCard } from '../../../src/components/ui/StatCard';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/src/api/don-hang';
import { getProducts } from '@/src/api/san-pham';
import { NotificationContext } from '@/src/hooks/useNotifications';
import { formatMoney, formatDate } from '@/src/utils/format';
import type { OrderNotif } from '@/src/types';
import { useRequireQuyen } from '@/src/hooks/useRequireQuyen';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10); // yyyy-MM-dd
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

export default function DashboardScreen() {
  useRequireQuyen('dashboard');
  const router = useRouter();

  // Lấy đơn hàng tháng này để tính doanh thu + đơn hôm nay
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard', 'orders-month'],
    queryFn: () => getOrders({ page: 1, limit: 500, tu_ngay: firstDayOfMonth }),
    staleTime: 2 * 60 * 1000,
  });

  // Lấy sản phẩm để tính tồn kho
  const { data: sanPhamData, isLoading: loadingSP } = useQuery({
    queryKey: ['dashboard', 'san-pham'],
    queryFn: () => getProducts({ page: 1, limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  // Lấy thông báo từ Context (đã được polling sẵn trong _layout)
  const notifCtx = useContext(NotificationContext);
  const loadingNotif = notifCtx?.loading ?? false;

  // Tính toán thống kê từ dữ liệu API
  const stats = useMemo(() => {
    const rawOrders: any[] = Array.isArray(ordersData?.data)
      ? ordersData.data
      : Array.isArray(ordersData)
      ? ordersData
      : [];

    const rawProducts: any[] = Array.isArray(sanPhamData?.data)
      ? sanPhamData.data
      : Array.isArray(sanPhamData)
      ? sanPhamData
      : [];

    // Đơn hôm nay
    const donHomNay = rawOrders.filter((o: any) => {
      if (!o.thoiGian) return false;
      return o.thoiGian.slice(0, 10) === todayStr;
    }).length;

    // Doanh thu tháng (chỉ tính đơn Đã giao)
    const doanhThuThang = rawOrders
      .filter((o: any) => o.trangThai === 'Đã giao')
      .reduce((sum: number, o: any) => sum + (o.tongTien || 0), 0);

    // Tổng đơn tháng
    const tongDonThang = rawOrders.length;

    // Sản phẩm
    const soSanPham = sanPhamData?.total ?? rawProducts.length ?? 0;
    const sanPhamHetHang = rawProducts.filter((p: any) => (p.soLuong ?? 0) === 0).length;
    const sanPhamSapHet = rawProducts.filter((p: any) => {
      const sl = p.soLuong ?? 0;
      return sl > 0 && sl <= 10;
    }).length;
    const tongTonKho = rawProducts.reduce((sum: number, p: any) => sum + (p.soLuong || 0), 0);

    // Top 5 sản phẩm bán chạy (chỉ tính đơn Đã giao)
    const productSales: Record<string, { ten: string; anhURL?: string; soLuong: number; doanhThu: number }> = {};
    rawOrders.filter((o) => o.trangThai === 'Đã giao').forEach((o) => {
      (o.sanPham || []).forEach((sp: any) => {
        const id = sp.id || sp.ten;
        if (!productSales[id]) {
          productSales[id] = { ten: sp.ten || 'Sản phẩm', anhURL: sp.anhURL, soLuong: 0, doanhThu: 0 };
        }
        productSales[id].soLuong += sp.soLuong || 1;
        productSales[id].doanhThu += (sp.giaHienThi || sp.gia || 0) * (sp.soLuong || 1);
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.soLuong - a.soLuong)
      .slice(0, 5);

    // Top 5 khách hàng (theo doanh thu, đơn Đã giao)
    const customerStats: Record<string, { ten: string; sdt: string; soDon: number; doanhThu: number }> = {};
    rawOrders.filter((o) => o.trangThai === 'Đã giao').forEach((o) => {
      const key = o.sdt || o.tenKH || 'unknown';
      if (!customerStats[key]) {
        customerStats[key] = { ten: o.tenKH || 'Khách lẻ', sdt: o.sdt || '', soDon: 0, doanhThu: 0 };
      }
      customerStats[key].soDon += 1;
      customerStats[key].doanhThu += o.tongTien || 0;
    });
    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.doanhThu - a.doanhThu)
      .slice(0, 5);

    // Doanh thu 7 ngày gần nhất
    const last7Days: { day: string; doanhThu: number; soDon: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = rawOrders.filter((o) => o.thoiGian?.slice(0, 10) === dayStr);
      const doanhThu = dayOrders
        .filter((o) => o.trangThai === 'Đã giao')
        .reduce((s, o) => s + (o.tongTien || 0), 0);
      last7Days.push({
        day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()],
        doanhThu,
        soDon: dayOrders.length,
      });
    }

    return {
      donHomNay,
      doanhThuThang,
      tongDonThang,
      soSanPham,
      sanPhamHetHang,
      sanPhamSapHet,
      tongTonKho,
      topProducts,
      topCustomers,
      last7Days,
    };
  }, [ordersData, sanPhamData]);

  // Hoạt động gần đây từ NotificationContext (đã normalize sẵn)
  const recentActivities: OrderNotif[] = useMemo(() => {
    const list = notifCtx?.notifications ?? [];
    return list.slice(0, 5);
  }, [notifCtx?.notifications]);

  const getActivityIcon = (loai: string) => {
    switch (loai) {
      case 'don_moi': return 'add-shopping-cart';
      case 'chuyen_trang_thai': return 'local-shipping';
      default: return 'notifications';
    }
  };

  const getActivityText = (item: OrderNotif) => {
    if (item.loai === 'don_moi') {
      return `Đơn hàng mới #${item.donHangId} - ${item.tenKH}`;
    }
    if (item.loai === 'chuyen_trang_thai') {
      return `Đơn #${item.donHangId} → ${item.trangThaiMoi}`;
    }
    return item.tenSP || 'Hoạt động mới';
  };

  const getActivitySub = (item: OrderNotif) => {
    const parts: string[] = [];
    if (item.thoiGian) parts.push(formatDate(item.thoiGian));
    if (item.tongTien) parts.push(formatMoney(item.tongTien));
    if (item.nguoiXuLy) parts.push(item.nguoiXuLy);
    return parts.join(' • ') || '—';
  };

  const isLoading = loadingOrders || loadingSP;

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar
        title="TRANG ANH"
        showMenu
        showNotifications
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeLabel}>TỔNG QUAN HÔM NAY</Text>
          <Text style={styles.welcomeTitle}>Chào buổi sáng, Admin</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Doanh thu tháng */}
          <View style={styles.statsRowFull}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <StatCard
                title="Doanh thu tháng"
                value={formatMoney(stats.doanhThuThang)}
                icon="shopping-bag"
                trend={`${stats.tongDonThang} đơn trong tháng`}
                trendUp={stats.tongDonThang > 0}
                variant="large"
              />
            )}
          </View>

          {/* Đơn hôm nay + Tổng đơn tháng */}
          <View style={styles.statsRow}>
            <View style={styles.statsCol}>
              {isLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <StatCard
                  title="Đơn hôm nay"
                  value={String(stats.donHomNay)}
                  icon="receipt-long"
                />
              )}
            </View>
            <View style={styles.statsCol}>
              {isLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <StatCard
                  title="Đơn tháng này"
                  value={String(stats.tongDonThang)}
                  icon="bar-chart"
                />
              )}
            </View>
          </View>

          {/* Sản phẩm đang bán */}
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => router.push('/(admin)/san-pham')}
            activeOpacity={0.7}
          >
            <View style={styles.productCardContent}>
              <View style={styles.productIcon}>
                <MaterialIcons name="checkroom" size={24} color={colors.primary} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productLabel}>Sản phẩm đang bán</Text>
                {loadingSP ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                ) : (
                  <Text style={styles.productValue}>{stats.soSanPham} mặt hàng</Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </View>
          </TouchableOpacity>

          {/* Hàng tồn kho */}
          <View style={styles.inventoryRow}>
            <View style={[styles.inventoryCard, { borderLeftColor: '#22C55E' }]}>
              <Text style={styles.inventoryLabel}>Tổng tồn</Text>
              <Text style={[styles.inventoryValue, { color: '#22C55E' }]}>{stats.tongTonKho}</Text>
              <Text style={styles.inventorySub}>sản phẩm</Text>
            </View>
            <View style={[styles.inventoryCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.inventoryLabel}>Sắp hết</Text>
              <Text style={[styles.inventoryValue, { color: '#F59E0B' }]}>{stats.sanPhamSapHet}</Text>
              <Text style={styles.inventorySub}>≤ 10 món</Text>
            </View>
            <View style={[styles.inventoryCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.inventoryLabel}>Hết hàng</Text>
              <Text style={[styles.inventoryValue, { color: '#EF4444' }]}>{stats.sanPhamHetHang}</Text>
              <Text style={styles.inventorySub}>cần nhập</Text>
            </View>
          </View>
        </View>

        {/* Chart 7 ngày — bar chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Doanh thu 7 ngày</Text>
              <Text style={styles.chartSubtitle}>
                Tổng: {formatMoney(stats.last7Days.reduce((s, d) => s + d.doanhThu, 0))}
              </Text>
            </View>
          </View>
          {(() => {
            const maxRevenue = Math.max(...stats.last7Days.map((d) => d.doanhThu), 1);
            return (
              <View style={styles.barChart}>
                {stats.last7Days.map((d, i) => {
                  const heightPct = (d.doanhThu / maxRevenue) * 100;
                  return (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${Math.max(heightPct, 3)}%`,
                              backgroundColor: d.doanhThu > 0 ? colors.primary : colors['surface-container'],
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{d.day}</Text>
                      <Text style={styles.barValue}>
                        {d.doanhThu > 0 ? `${Math.round(d.doanhThu / 1000)}k` : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>

        {/* Top sản phẩm bán chạy */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>🔥 Top sản phẩm bán chạy</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/san-pham')}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rankingList}>
            {stats.topProducts.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            ) : (
              stats.topProducts.map((p, i) => (
                <View key={i} style={styles.rankItem}>
                  <View style={[styles.rankBadge, i === 0 && styles.rankGold, i === 1 && styles.rankSilver, i === 2 && styles.rankBronze]}>
                    <Text style={styles.rankNumber}>{i + 1}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName} numberOfLines={1}>{p.ten}</Text>
                    <Text style={styles.rankSub}>{p.soLuong} đã bán · {formatMoney(p.doanhThu)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Top khách hàng */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>👑 Top khách hàng VIP</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/khach-hang')}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rankingList}>
            {stats.topCustomers.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            ) : (
              stats.topCustomers.map((c, i) => (
                <View key={i} style={styles.rankItem}>
                  <View style={[styles.rankBadge, i === 0 && styles.rankGold, i === 1 && styles.rankSilver, i === 2 && styles.rankBronze]}>
                    <Text style={styles.rankNumber}>{i + 1}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName} numberOfLines={1}>{c.ten}</Text>
                    <Text style={styles.rankSub}>{c.soDon} đơn · {formatMoney(c.doanhThu)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Hoạt động gần đây */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Hoạt động gần đây</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/don-hang')}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {loadingNotif ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : recentActivities.length === 0 ? (
              <View style={styles.emptyActivity}>
                <MaterialIcons name="inbox" size={32} color={colors['on-surface-variant']} />
                <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
              </View>
            ) : (
              recentActivities.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityItem}
                  onPress={() => router.push({
                    pathname: '/(admin)/don-hang/[id]' as any,
                    params: { id: item.donHangId },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIcon, !item.daDoc && styles.activityIconUnread]}>
                    <MaterialIcons
                      name={getActivityIcon(item.loai) as any}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, !item.daDoc && { fontWeight: '700' }]}>
                      {getActivityText(item)}
                    </Text>
                    <Text style={styles.activityTime}>{getActivitySub(item)}</Text>
                  </View>
                  {!item.daDoc && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  welcomeLabel: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing['label-sm'],
    marginBottom: 4,
  },
  welcomeTitle: {
    fontFamily: typography.fontFamily.h1,
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.h1,
    color: colors.primary,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statsRowFull: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsCol: {
    flex: 1,
  },
  loadingCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    padding: spacing.md,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  productCard: {
    backgroundColor: colors['surface-container-lowest'],
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    ...shadows.card,
  },
  productCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors['surface-container-low'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productLabel: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
  },
  productValue: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: colors['surface-container-lowest'],
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    marginTop: spacing.md,
    ...shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
  },
  chartSubtitle: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  chartLegend: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chartPlaceholder: {
    height: 160,
    backgroundColor: colors['surface-container-low'],
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chartPlaceholderText: {
    fontFamily: typography.fontFamily['body-md'],
    fontSize: typography.fontSize['body-md'],
    color: colors['on-surface-variant'],
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  chartLabel: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 10,
    color: colors['on-surface-variant'],
  },
  activitySection: {
    marginTop: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityTitle: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
  },
  viewAllText: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  activityList: {
    gap: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors['surface-container-lowest'],
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors['surface-container-low'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconUnread: {
    backgroundColor: colors['surface-container'],
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: typography.fontFamily['body-md'],
    fontSize: typography.fontSize['body-md'],
    fontWeight: '500',
    color: colors['on-surface'],
  },
  activityTime: {
    fontFamily: typography.fontFamily['body-md'],
    fontSize: 12,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 8,
  },
  emptyText: {
    fontFamily: typography.fontFamily['body-md'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  // Inventory cards
  inventoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inventoryCard: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderLeftWidth: 4,
    ...shadows.card,
  },
  inventoryLabel: {
    fontSize: 11,
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inventoryValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  inventorySub: {
    fontSize: 10,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    paddingTop: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: colors['on-surface-variant'],
    fontWeight: '600',
  },
  barValue: {
    fontSize: 9,
    color: colors['on-surface-variant'],
  },

  // Ranking list
  rankingList: {
    gap: spacing.sm,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    padding: spacing.sm,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors['surface-container-low'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankGold: {
    backgroundColor: '#FFD700',
  },
  rankSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  rankSub: {
    fontSize: 12,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
});
