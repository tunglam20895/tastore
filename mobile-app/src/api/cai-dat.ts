import { apiClient } from './client';
import type { CaiDat, ApiResponse } from '@/src/types';

export async function getSettings() {
  const res = await apiClient.get<ApiResponse<CaiDat>>('/api/cai-dat');
  return res.data;
}

export async function updateSettings(data: Record<string, string>) {
  const res = await apiClient.put('/api/cai-dat', data);
  return res.data;
}
