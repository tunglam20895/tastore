import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

/**
 * Hook guard phân quyền cho từng màn hình.
 * Nếu nhân viên không có quyền → redirect về màn hình đầu tiên họ được phép.
 *
 * @param quyen - key quyền cần có (vd: 'don-hang', 'san-pham')
 *                undefined = admin only
 */
export function useRequireQuyen(quyen?: string) {
  const router = useRouter();
  const { role, staffQuyen } = useAuthStore();

  useEffect(() => {
    if (role === 'admin') return; // Admin qua hết

    // Admin only route
    if (!quyen) {
      redirectToFirstAllowed(staffQuyen, router);
      return;
    }

    // Không có quyền cụ thể
    if (!staffQuyen.includes(quyen)) {
      redirectToFirstAllowed(staffQuyen, router);
    }
  }, [role, staffQuyen, quyen]);
}

const QUYEN_ROUTES: Record<string, string> = {
  'dashboard':   '/(admin)/dashboard',
  'don-hang':    '/(admin)/don-hang',
  'san-pham':    '/(admin)/san-pham',
  'khach-hang':  '/(admin)/khach-hang',
  'ma-giam-gia': '/(admin)/ma-giam-gia',
};

function redirectToFirstAllowed(staffQuyen: string[], router: any) {
  const firstRoute = Object.entries(QUYEN_ROUTES).find(([q]) => staffQuyen.includes(q));
  if (firstRoute) {
    router.replace(firstRoute[1] as any);
  } else {
    router.replace('/(auth)/login' as any);
  }
}
