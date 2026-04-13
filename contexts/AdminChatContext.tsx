'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ScreenData = {
  page: string;
  title: string;
  summary: string;
  filters?: string[];
  items?: string[]; // Các mục đang hiển thị
  stats?: Record<string, string | number>; // Key-value stats
} | null;

interface AdminChatContextValue {
  screenData: ScreenData;
  setScreenData: (data: ScreenData | ((prev: ScreenData) => ScreenData)) => void;
}

const AdminChatContext = createContext<AdminChatContextValue>({
  screenData: null,
  setScreenData: () => {},
});

export function AdminChatProvider({ children }: { children: ReactNode }) {
  const [screenData, setScreenData] = useState<ScreenData>(null);

  return (
    <AdminChatContext.Provider value={{ screenData, setScreenData }}>
      {children}
    </AdminChatContext.Provider>
  );
}

export function useAdminChat() {
  return useContext(AdminChatContext);
}
