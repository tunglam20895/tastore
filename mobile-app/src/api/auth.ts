import { apiClient } from './client';

export async function loginAdmin(password: string): Promise<{ success: boolean; role?: 'admin'; adminToken?: string; error?: string }> {
  const res = await apiClient.post('/api/authenticate', { password });
  return res.data;
}

export async function loginStaff(username: string, password: string) {
  const res = await apiClient.post('/api/authenticate', { username, password });
  return res.data;
}

export async function logout() {
  try {
    await apiClient.post('/api/logout');
  } catch {
    // Ignore errors on logout
  }
}
