import React, { useMemo } from 'react';
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
import { getNotifications } from '@/src/api/thong-bao';
import { formatMoney, formatDate } from '@/src/utils/format';
import type { OrderNotif } from '@/src/types';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10); // yyyy-MM-dd
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

export default function DashboardScreen() {
  const router = useRouter();

  // Lấy đơn hàng tháng này để tính doanh thu + đơn hôm nay
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard', 'orders-month'],
    queryFn: () => getOrders({ page: 1, limit: 500, tu_ngay: firstDayOfMonth }),
    staleTime: 2 * 60 * 1000,
  });

  // Lấy sản phẩm đang bán
  const { data: sanPhamData, isLoading: loadingSP } = useQuery({
    queryKey: ['dashboard', 'san-pham'],
    queryFn: () => getProducts({ page: 1, limit: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  // Lấy thông báo / hoạt động gần đây
  const { data: notifications, isLoading: loadingNotif } = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: getNotifications,
    staleTime: 60 * 1000,
  });

  // Tính toán thống kê từ dữ liệu API
  const stats = useMemo(() => {
    const rawOrders: any[] = Array.isArray(ordersData?.data)
      ? ordersData.data
      : Array.isArray(ordersData)
      ? ordersData
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

    // Sản phẩm đang bán
    const soSanPham = sanPhamData?.total ?? sanPhamData?.data?.length ?? 0;

    return { donHomNay, doanhThuThang, tongDonThang, soSanPham };
  }, [ordersData, sanPhamData]);

  // Hoạt động gần đây từ notifications
  const recentActivities: OrderNotif[] = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    return notifications.slice(0, 5);
  }, [notifications]);

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
        onNotificationPress={() => {}}
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
        </View>

        {/* Chart placeholder */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Hiệu quả kinh doanh</Text>
              <Text style={styles.chartSubtitle}>7 ngày gần nhất</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Đơn hàng</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Biểu đồ sẽ hiển thị ở đây</Text>
          </View>
          <View style={styles.chartLabels}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <Text key={day} style={styles.chartLabel}>{day}</Text>
            ))}
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
  },
});
