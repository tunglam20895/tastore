import React, { useMemo, useState } from 'react';
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
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useRequireQuyen } from '@/src/hooks/useRequireQuyen';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/src/api/don-hang';
import { formatMoney } from '@/src/utils/format';

interface ApiOrder {
  id: string;
  tenKH?: string;
  sdt?: string;
  trangThai?: string;
  tongTien?: number;
  thoiGian?: string;
  sanPham?: Array<{
    ten?: string;
    sizeChon?: string;
    mauSac?: string;
    soLuong?: number;
    anhURL?: string;
  }>;
}

interface OrderCardData {
  id: string;
  customerName: string;
  orderCode: string;
  status: 'new' | 'processing' | 'delivered' | 'cancelled';
  items: number;
  total: string;
  time: string;
  productName: string;
  productVariant: string;
  productImage?: string;
}

const STATUS_CONFIG = {
  new: { label: 'Mới', color: '#3B82F6', bgColor: '#DBEAFE', borderColor: '#93C5FD' },
  processing: { label: 'Đang xử lý', color: '#F59E0B', bgColor: '#FEF3C7', borderColor: '#FCD34D' },
  delivered: { label: 'Đã giao', color: '#10B981', bgColor: '#D1FAE5', borderColor: '#6EE7B7' },
  cancelled: { label: 'Huỷ', color: '#EF4444', bgColor: '#FEE2E2', borderColor: '#FCA5A5' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'new', label: 'Mới' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Huỷ' },
];

const normalizeStatus = (status?: string): OrderCardData['status'] => {
  if (!status) return 'new';
  if (status === 'Đã giao') return 'delivered';
  if (status === 'Huỷ') return 'cancelled';
  if (status === 'Mới') return 'new';
  return 'processing';
};

const toOrderCard = (order: ApiOrder): OrderCardData => {
  const firstProduct = order.sanPham?.[0];
  const variantParts = [
    firstProduct?.sizeChon ? `Size: ${firstProduct.sizeChon}` : null,
    firstProduct?.mauSac ? `Màu: ${firstProduct.mauSac}` : null,
  ].filter(Boolean);

  return {
    id: String(order.id),
    customerName: order.tenKH || 'Khách lẻ',
    orderCode: `#${order.id}`,
    status: normalizeStatus(order.trangThai),
    items: order.sanPham?.reduce((sum, p) => sum + (p.soLuong || 1), 0) || 0,
    total: formatMoney(order.tongTien || 0),
    time: order.thoiGian || '',
    productName: firstProduct?.ten || 'Không có sản phẩm',
    productVariant: variantParts.length > 0 ? variantParts.join(' | ') : '—',
    productImage: firstProduct?.anhURL || undefined,
  };
};

export default function DonHangScreen() {
  useRequireQuyen('don-hang');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['orders', 'list', { searchQuery, activeFilter }],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: 50,
      };

      if (searchQuery.trim()) {
        params.search_ten = searchQuery.trim();
      }

      if (activeFilter !== 'all') {
        const map: Record<string, string> = {
          new: 'Mới',
          processing: 'Đang xử lý',
          delivered: 'Đã giao',
          cancelled: 'Huỷ',
        };
        params.trang_thai = map[activeFilter];
      }

      return getOrders(params);
    },
  });

  const orders = useMemo(() => {
    const rawList = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    return rawList.map(toOrderCard);
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter((o) => o.status === activeFilter);
  }, [orders, activeFilter]);

  const handleOrderPress = (order: OrderCardData) => {
    router.push({
      pathname: '/(admin)/don-hang/[id]' as any,
      params: { id: order.id },
    });
  };

  const renderOrderCard = (order: OrderCardData) => {
    const statusConfig = STATUS_CONFIG[order.status];
    const isCancelled = order.status === 'cancelled';

    return (
      <TouchableOpacity
        key={order.id}
        style={[styles.orderCard, isCancelled && styles.orderCardCancelled]}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderCode}>{order.orderCode}</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.productSection}>
          {order.productImage ? (
            <Image
              source={{ uri: order.productImage }}
              style={styles.productImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.productImage}>
              <MaterialIcons name="checkroom" size={32} color={colors['on-surface-variant']} />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text
              style={[styles.productName, isCancelled && styles.textCancelled]}
              numberOfLines={1}
            >
              {order.productName}
            </Text>
            <Text style={styles.productVariant}>{order.productVariant}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{order.items} sản phẩm</Text>
          <Text
            style={[
              styles.orderTotal,
              isCancelled && styles.orderTotalCancelled,
            ]}
          >
            {order.total}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopAppBar
        title="TRANG ANH"
        showMenu
        showNotifications
      />

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <SearchBar
            placeholder="Tìm kiếm mã đơn, khách hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabs}
          >
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  activeFilter === tab.key && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === tab.key && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading || isRefetching ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.helperText}>Đang tải danh sách đơn hàng...</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <MaterialIcons name="error-outline" size={42} color={colors.error} />
            <Text style={styles.helperText}>Không tải được danh sách đơn hàng</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          >
            {filteredOrders.length === 0 ? (
              <View style={styles.centerState}>
                <MaterialIcons name="inbox" size={42} color={colors['on-surface-variant']} />
                <Text style={styles.helperText}>Không có đơn hàng</Text>
              </View>
            ) : (
              filteredOrders.map(renderOrderCard)
            )}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(admin)/don-hang/add' as any)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color={colors['on-primary']} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandBg,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  filterTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    fontWeight: '600',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing['label-sm'],
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  ordersList: {
    padding: spacing.sm,
    gap: spacing.sm,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  orderCardCancelled: {
    opacity: 0.6,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderCode: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
  },
  customerName: {
    fontFamily: typography.fontFamily.h2,
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors['surface-container'],
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors['surface-container-low'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors['on-surface'],
    marginBottom: 2,
  },
  productVariant: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 12,
    color: colors['on-surface-variant'],
  },
  textCancelled: {
    textDecorationLine: 'line-through',
    color: colors['on-surface-variant'],
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 12,
    color: colors['on-surface-variant'],
  },
  orderTotal: {
    fontFamily: typography.fontFamily.h3,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  orderTotalCancelled: {
    color: colors['on-surface-variant'],
    textDecorationLine: 'line-through',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  helperText: {
    fontFamily: typography.fontFamily.body,
    color: colors['on-surface-variant'],
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    color: colors['on-primary'],
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
});
