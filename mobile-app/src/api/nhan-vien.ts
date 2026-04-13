import { apiClient } from './client';
import type { NhanVien, ApiResponse } from '@/src/types';

export async function getStaff() {
  const res = await apiClient.get<ApiResponse<NhanVien[]>>('/api/nhan-vien');
  return res.data;
}

export async function createStaff(data: Record<string, unknown>) {
  const res = await apiClient.post('/api/nhan-vien', data);
  return res.data;
}

export async function updateStaff(id: string, data: Record<string, unknown>) {
  const res = await apiClient.put(`/api/nhan-vien/${id}`, data);
  return res.data;
}

export async function deleteStaff(id: string) {
  const res = await apiClient.delete(`/api/nhan-vien/${id}`);
  return res.data;
}
