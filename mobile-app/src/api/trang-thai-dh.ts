import { apiClient } from './client';
import type { TrangThaiDH } from '@/src/types';

export async function getTrangThaiDH() {
  try {
    const res = await apiClient.get<TrangThaiDH[]>('/api/trang-thai-dh');
    return res.data;
  } catch {
    return [];
  }
}

export async function updateTrangThaiDH(key: string, data: { ten?: string; mau?: string; thuTu?: number }) {
  const res = await apiClient.put('/api/trang-thai-dh', { key, ...data });
  return res.data;
}
