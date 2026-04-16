import { apiClient } from './client';
import type { DonHang, PaginatedResponse } from '@/src/types';
import Toast from 'react-native-toast-message';

export async function getOrders(params: {
  page: number;
  limit: number;
  trang_thai?: string;
  search_ten?: string;
  search_sdt?: string;
  tu_ngay?: string;
  den_ngay?: string;
  sdt?: string;
}) {
  const res = await apiClient.get('/api/don-hang', { params });
  return res.data;
}

export async function getOrder(id: string) {
  const res = await apiClient.get(`/api/don-hang/${id}`);
  const body = res.data as any;
  if (body?.success && body?.data) return body.data;
  return res.data;
}

export async function updateOrderStatus(id: string, trangThai: string, nguoiXuLy?: string) {
  const res = await apiClient.put(`/api/don-hang/${id}`, {
    trangThai,
    nguoiXuLy: nguoiXuLy || 'Admin',
  });
  Toast.show({
    type: 'success',
    text1: '✅ Đã cập nhật',
    text2: `Trạng thái → "${trangThai}"`,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}

export async function bulkUpdateStatus(ids: string[], trangThai: string) {
  const res = await apiClient.post('/api/don-hang/bulk-status', { ids, trang_thai: trangThai });
  Toast.show({
    type: 'success',
    text1: '✅ Đã cập nhật',
    text2: `${ids.length} đơn hàng → "${trangThai}"`,
    position: 'top',
    visibilityTime: 2500,
    topOffset: 60,
  });
  return res.data;
}
