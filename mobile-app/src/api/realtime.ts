import { apiClient } from './client';

export type RealtimeConfig = {
  enabled: boolean;
  provider: 'pusher' | null;
  key: string | null;
  cluster: string | null;
  notificationsChannel: string | null;
};

export async function getRealtimeConfig(): Promise<RealtimeConfig> {
  const res = await apiClient.get('/api/realtime-config');
  const body = res.data as any;
  return body?.data || { enabled: false, provider: null, key: null, cluster: null, notificationsChannel: null };
}
