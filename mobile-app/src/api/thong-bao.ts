import { apiClient } from './client';
import type { OrderNotif } from '@/src/types';

export async function getNotifications() {
  const res = await apiClient.get<OrderNotif[]>('/api/thong-bao');
  return res.data;
}

export async function markNotificationsRead() {
  const res = await apiClient.put('/api/thong-bao');
  return res.data;
}
