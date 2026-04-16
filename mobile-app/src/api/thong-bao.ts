import { apiClient } from './client';
import type { OrderNotif } from '@/src/types';

export async function getNotifications() {
  const res = await apiClient.get('/api/thong-bao');
  // Backend returns { success: true, data: [...] }
  const body = res.data as any;
  if (body?.success && body?.data) return body.data as OrderNotif[];
  return (body as OrderNotif[]) || [];
}

/** Đánh dấu tất cả đã đọc */
export async function markAllNotificationsRead() {
  const res = await apiClient.put('/api/thong-bao', { markAll: true });
  return res.data;
}

/** Đánh dấu một hoặc nhiều thông báo đã đọc theo id */
export async function markNotificationsReadByIds(ids: string[]) {
  const res = await apiClient.put('/api/thong-bao', { ids });
  return res.data;
}
