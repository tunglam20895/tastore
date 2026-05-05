import { create } from 'zustand';
import { Platform } from 'react-native';

// Web fallback for SecureStore using localStorage
const isWeb = Platform.OS === 'web';

const webStore = {
  getItemAsync: async (key: string) => localStorage.getItem(key),
  setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
  deleteItemAsync: async (key: string) => localStorage.removeItem(key),
};

const SecureStore = isWeb ? webStore : require('expo-secure-store');

type AuthRole = 'admin' | 'staff' | null;

interface AuthState {
  role: AuthRole;
  adminToken: string | null;
  staffToken: string | null;
  staffQuyen: string[];
  staffTen: string;
  staffId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginAsAdmin: (token: string) => Promise<void>;
  loginAsStaff: (token: string, quyen: string[], ten: string, id: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  adminToken: null,
  staffToken: null,
  staffQuyen: [],
  staffTen: '',
  staffId: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const adminToken = await SecureStore.getItemAsync('admin-token');
      if (adminToken && adminToken.trim().length > 0) {
        set({ role: 'admin', adminToken, isAuthenticated: true, isLoading: false });
        return;
      }

      const legacyAdminPassword = await SecureStore.getItemAsync('admin-password');
      if (legacyAdminPassword) {
        await SecureStore.deleteItemAsync('admin-password').catch(() => {});
      }

      const staffToken = await SecureStore.getItemAsync('staff-token');
      if (staffToken && staffToken.trim().length > 0) {
        const quyen = (await SecureStore.getItemAsync('staff-quyen'))?.split(',').filter(Boolean) || [];
        const ten = (await SecureStore.getItemAsync('staff-ten')) || '';
        const id = (await SecureStore.getItemAsync('staff-id')) || null;
        set({ role: 'staff', staffToken, staffQuyen: quyen, staffTen: ten, staffId: id, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch { /* ignore */ }
    set({ isAuthenticated: false, isLoading: false });
  },

  loginAsAdmin: async (token: string) => {
    await SecureStore.setItemAsync('admin-token', token);
    await SecureStore.deleteItemAsync('admin-password').catch(() => {});
    await SecureStore.deleteItemAsync('staff-token').catch(() => {});
    await SecureStore.deleteItemAsync('staff-quyen').catch(() => {});
    await SecureStore.deleteItemAsync('staff-ten').catch(() => {});
    await SecureStore.deleteItemAsync('staff-id').catch(() => {});
    set({ role: 'admin', adminToken: token, staffToken: null, staffQuyen: [], staffTen: '', staffId: null, isAuthenticated: true });
  },

  loginAsStaff: async (token: string, quyen: string[], ten: string, id: string) => {
    await SecureStore.setItemAsync('staff-token', token);
    await SecureStore.setItemAsync('staff-quyen', quyen.join(','));
    await SecureStore.setItemAsync('staff-ten', ten);
    await SecureStore.setItemAsync('staff-id', id);
    await SecureStore.deleteItemAsync('admin-token').catch(() => {});
    await SecureStore.deleteItemAsync('admin-password').catch(() => {});
    set({ role: 'staff', staffToken: token, staffQuyen: quyen, staffTen: ten, staffId: id, adminToken: null, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('admin-token').catch(() => {});
    await SecureStore.deleteItemAsync('admin-password').catch(() => {});
    await SecureStore.deleteItemAsync('staff-token').catch(() => {});
    await SecureStore.deleteItemAsync('staff-quyen').catch(() => {});
    await SecureStore.deleteItemAsync('staff-ten').catch(() => {});
    await SecureStore.deleteItemAsync('staff-id').catch(() => {});
    set({ role: null, adminToken: null, staffToken: null, staffQuyen: [], staffTen: '', staffId: null, isAuthenticated: false });
  },
}));
