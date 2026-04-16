import { apiClient } from './client';
import type { OrderNotif } from '@/src/types';

export async function getNotifications() {
  const res = await apiClient.get('/api/thong-bao');
  // Backend returns { success: true, data: [...] }
  const body = res.data as any;
  if (body?.success && body?.data) return body.data as OrderNotif[];
  return (body as OrderNotif[]) || [];
}

export async function markNotificationsRead(body?: Record<string, unknown>) {
  // Always send body so backend can parse it
  const res = await apiClient.put('/api/thong-bao', body || { markAll: true });
  return res.data;
}
