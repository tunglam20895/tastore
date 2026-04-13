import { apiClient } from './client';
import type { MaGiamGia, PaginatedResponse } from '@/src/types';

export async function getCoupons(params: {
  page: number;
  limit: number;
}) {
  const res = await apiClient.get<PaginatedResponse<MaGiamGia>>('/api/ma-giam-gia', { params });
  return res.data;
}

export async function createCoupon(data: Record<string, unknown>) {
  const res = await apiClient.post('/api/ma-giam-gia', data);
  return res.data;
}

export async function toggleCoupon(id: string, conHieuLuc: boolean) {
  const res = await apiClient.put(`/api/ma-giam-gia/${id}`, { con_hieu_luc: conHieuLuc });
  return res.data;
}

export async function deleteCoupon(id: string) {
  const res = await apiClient.delete(`/api/ma-giam-gia/${id}`);
  return res.data;
}
