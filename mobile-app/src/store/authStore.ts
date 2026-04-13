import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthRole = 'admin' | 'staff' | null;

interface AuthState {
  role: AuthRole;
  adminPassword: string | null;
  staffToken: string | null;
  staffQuyen: string[];
  staffTen: string;
  staffId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginAsAdmin: (password: string) => Promise<void>;
  loginAsStaff: (token: string, quyen: string[], ten: string, id: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  adminPassword: null,
  staffToken: null,
  staffQuyen: [],
  staffTen: '',
  staffId: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const adminPw = await SecureStore.getItemAsync('admin-password');
      if (adminPw) {
        set({ role: 'admin', adminPassword: adminPw, isAuthenticated: true, isLoading: false });
        return;
      }
      const staffToken = await SecureStore.getItemAsync('staff-token');
      if (staffToken) {
        const quyen = (await SecureStore.getItemAsync('staff-quyen'))?.split(',').filter(Boolean) || [];
        const ten = (await SecureStore.getItemAsync('staff-ten')) || '';
        const id = (await SecureStore.getItemAsync('staff-id')) || null;
        set({ role: 'staff', staffToken, staffQuyen: quyen, staffTen: ten, staffId: id, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch { /* ignore */ }
    set({ isLoading: false });
  },

  loginAsAdmin: async (password: string) => {
    await SecureStore.setItemAsync('admin-password', password);
    await SecureStore.deleteItemAsync('staff-token').catch(() => {});
    await SecureStore.deleteItemAsync('staff-quyen').catch(() => {});
    await SecureStore.deleteItemAsync('staff-ten').catch(() => {});
    await SecureStore.deleteItemAsync('staff-id').catch(() => {});
    set({ role: 'admin', adminPassword: password, staffToken: null, staffQuyen: [], staffTen: '', staffId: null, isAuthenticated: true });
  },

  loginAsStaff: async (token: string, quyen: string[], ten: string, id: string) => {
    await SecureStore.setItemAsync('staff-token', token);
    await SecureStore.setItemAsync('staff-quyen', quyen.join(','));
    await SecureStore.setItemAsync('staff-ten', ten);
    await SecureStore.setItemAsync('staff-id', id);
    await SecureStore.deleteItemAsync('admin-password').catch(() => {});
    set({ role: 'staff', staffToken: token, staffQuyen: quyen, staffTen: ten, staffId: id, adminPassword: null, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('admin-password').catch(() => {});
    await SecureStore.deleteItemAsync('staff-token').catch(() => {});
    await SecureStore.deleteItemAsync('staff-quyen').catch(() => {});
    await SecureStore.deleteItemAsync('staff-ten').catch(() => {});
    await SecureStore.deleteItemAsync('staff-id').catch(() => {});
    set({ role: null, adminPassword: null, staffToken: null, staffQuyen: [], staffTen: '', staffId: null, isAuthenticated: false });
  },
}));
