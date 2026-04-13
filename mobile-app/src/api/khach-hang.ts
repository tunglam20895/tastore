import { apiClient } from './client';
import type { KhachHang, PaginatedResponse, TrangThaiKH } from '@/src/types';

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
  return res.data;
}

export async function getTrangThaiKH() {
  const res = await apiClient.get<TrangThaiKH[]>('/api/trang-thai-kh');
  return res.data;
}
