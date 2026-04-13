import { apiClient } from './client';
import type { DonHang, PaginatedResponse } from '@/src/types';

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
  const res = await apiClient.get<PaginatedResponse<DonHang>>('/api/don-hang', { params });
  return res.data;
}

export async function getOrder(id: string) {
  const res = await apiClient.get<DonHang>(`/api/don-hang/${id}`);
  return res.data;
}

export async function updateOrderStatus(id: string, trangThai: string, nguoiXuLy?: string) {
  const res = await apiClient.put(`/api/don-hang/${id}`, { trang_thai: trangThai, nguoi_xu_ly: nguoiXuLy });
  return res.data;
}

export async function bulkUpdateStatus(ids: string[], trangThai: string) {
  const res = await apiClient.post('/api/don-hang/bulk-status', { ids, trang_thai: trangThai });
  return res.data;
}
