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

  if (state.role === 'admin' && state.adminToken) {
    config.headers['admin-token'] = state.adminToken;
  } else if (state.role === 'staff' && state.staffToken) {
    config.headers['staff-token'] = state.staffToken;
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isWeb) {
      console.error(
        '[API Error]',
        error.code,
        error.message,
        'URL:', error.config?.url,
        'Status:', error?.response?.status,
      );
    }

    // Chỉ logout khi 401 xảy ra trên auth endpoint (token thực sự bị từ chối)
    // KHÔNG logout khi 401 do lỗi nghiệp vụ (vd: sai mật khẩu khi đăng nhập)
    if (error?.response?.status === 401) {
      const url: string = error.config?.url || '';
      const isAuthEndpoint = url.includes('/api/authenticate');
      const isOptionalNotificationEndpoint = url.includes('/api/thong-bao');
      // Không logout vì lỗi quyền thông báo: thông báo là tính năng phụ, không phải auth core.
      // Logout chỉ khi token thật sự hết hạn/không hợp lệ ở API nghiệp vụ chính.
      if (!isAuthEndpoint && !isOptionalNotificationEndpoint) {
        const { logout } = useAuthStore.getState();
        logout().catch(() => {});
      }
    }

    return Promise.reject(error);
  }
);
