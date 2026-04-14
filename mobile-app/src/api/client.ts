import axios from 'axios';
import { API_URL } from '@/src/utils/constants';
import { useAuthStore } from '@/src/store/authStore';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: tự động attach auth headers
apiClient.interceptors.request.use((config) => {
  const state = useAuthStore.getState();

  if (state.role === 'admin' && state.adminPassword) {
    config.headers['x-admin-password'] = state.adminPassword;
  } else if (state.role === 'staff' && state.staffToken) {
    config.headers['staff-token'] = state.staffToken;
  }

  return config;
});
