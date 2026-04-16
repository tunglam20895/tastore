import axios from 'axios';
import { API_URL } from '@/src/utils/constants';
import { useAuthStore } from '@/src/store/authStore';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// On web, use API_URL directly (CORS must be enabled on backend)
// If CORS issues, set this to a proxy or fix backend CORS config
const baseURL = API_URL;

export const apiClient = axios.create({
  baseURL,
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

// Response interceptor: better error handling for web
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isWeb && error.code === 'ERR_NETWORK') {
      console.error(
        '[API CORS Error] Trình duyệt chặn request đến',
        error.config?.url,
        '\nFix: Backend cần có CORS headers hoặc chạy backend với --cors flag'
      );
    }
    return Promise.reject(error);
  }
);
