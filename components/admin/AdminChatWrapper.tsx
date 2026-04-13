'use client';

import { usePathname } from 'next/navigation';
import AdminChat from './AdminChat';
import { AdminChatProvider } from '@/contexts/AdminChatContext';

const pageMap: Record<string, string> = {
  '/admin/dashboard': 'dashboard',
  '/admin/san-pham': 'san-pham',
  '/admin/don-hang': 'don-hang',
  '/admin/khach-hang': 'khach-hang',
  '/admin/ma-giam-gia': 'ma-giam-gia',
  '/admin/nhan-vien': 'nhan-vien',
  '/admin/cai-dat': 'cai-dat',
};

export default function AdminChatWrapper() {
  const pathname = usePathname();
  const currentPage = pageMap[pathname] || 'dashboard';

  return (
    <AdminChatProvider>
      <AdminChat currentPage={currentPage} />
    </AdminChatProvider>
  );
}
