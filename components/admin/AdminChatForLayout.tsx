'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminChat from './AdminChat';
import { useAdminChat } from '@/contexts/AdminChatContext';

const pageMap: Record<string, string> = {
  '/admin/dashboard': 'dashboard',
  '/admin/san-pham': 'san-pham',
  '/admin/don-hang': 'don-hang',
  '/admin/khach-hang': 'khach-hang',
  '/admin/ma-giam-gia': 'ma-giam-gia',
  '/admin/nhan-vien': 'nhan-vien',
  '/admin/cai-dat': 'cai-dat',
};

export default function AdminChatForLayout() {
  const pathname = usePathname();
  const currentPage = pageMap[pathname] || 'dashboard';
  const { setScreenData } = useAdminChat();

  // Clear screen data when navigating between pages
  useEffect(() => {
    setScreenData(null);
  }, [pathname, setScreenData]);

  return <AdminChat currentPage={currentPage} />;
}
