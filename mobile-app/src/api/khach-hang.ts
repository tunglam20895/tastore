import { apiClient } from './client';
import type { KhachHang, PaginatedResponse, TrangThaiKH } from '@/src/types';
import Toast from 'react-native-toast-message';

export async function getCustomers(params: {
  page: number;
  limit: number;
  trang_thai?: string;
  search?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<KhachHang>>('/api/khach-hang', { params });
  return res.data;
}

export async function updateCustomer(sdt: string, data: { trang_thai?: string; ghi_chu?: string }) {
  const res = await apiClient.put(`/api/khach-hang/${encodeURIComponent(sdt)}`, data);
  Toast.show({
    type: 'success',
    text1: '✅ Đã cập nhật',
    text2: `Thông tin khách hàng đã được lưu`,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}

export async function getTrangThaiKH() {
  const res = await apiClient.get<TrangThaiKH[]>('/api/trang-thai-kh');
  return res.data;
}

export async function deleteCustomer(sdt: string) {
  const res = await apiClient.delete(`/api/khach-hang/${encodeURIComponent(sdt)}`);
  Toast.show({
    type: 'success',
    text1: '🗑️ Đã xóa',
    text2: 'Khách hàng đã được xóa',
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}
