"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface TrangThaiDH {
  key: string;
  ten: string;
  mau: string;
  thuTu?: number;
}

const TrangThaiDHContext = createContext<{
  trangThais: TrangThaiDH[];
  refresh: () => void;
}>({
  trangThais: [],
  refresh: () => {},
});

export function TrangThaiDHProvider({ children }: { children: ReactNode }) {
  // Default colors — luôn có sẵn, không bao giờ lỗi
  const [trangThais, setTrangThais] = useState<TrangThaiDH[]>([
    { key: "Mới", ten: "Mới", mau: "#3B82F6", thuTu: 1 },
    { key: "Chốt để lên đơn", ten: "Chốt để lên đơn", mau: "#A855F7", thuTu: 2 },
    { key: "Đã lên đơn", ten: "Đã lên đơn", mau: "#14B8A6", thuTu: 3 },
    { key: "Đang xử lý", ten: "Đang xử lý", mau: "#F59E0B", thuTu: 4 },
    { key: "Đã giao", ten: "Đã giao", mau: "#22C55E", thuTu: 5 },
    { key: "Huỷ", ten: "Huỷ", mau: "#EF4444", thuTu: 6 },
  ]);

  const fetchTrangThais = async () => {
    try {
      const res = await fetch("/api/trang-thai-dh");
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setTrangThais(data.data);
      }
      // Nếu API lỗi hoặc chưa có bảng → dùng default colors (không bắn toast)
    } catch {
      // Silent fail — dùng default colors
    }
  };

  useEffect(() => {
    fetchTrangThais();
  }, []);

  return (
    <TrangThaiDHContext.Provider value={{ trangThais, refresh: fetchTrangThais }}>
      {children}
    </TrangThaiDHContext.Provider>
  );
}

export const useTrangThaiDH = () => useContext(TrangThaiDHContext);

/**
 * Helper: lấy màu cho 1 trạng thái (hex string)
 * Nếu chưa có trong DB, trả về màu mặc định
 */
export function getTrangThaiMau(
  trangThais: TrangThaiDH[],
  trangThai: string
): string {
  const found = trangThais.find((tt) => tt.key === trangThai);
  if (found) return found.mau;

  // Fallback colors
  const fallbacks: Record<string, string> = {
    "Mới": "#3B82F6",
    "Chốt để lên đơn": "#A855F7",
    "Đã lên đơn": "#14B8A6",
    "Đang xử lý": "#F59E0B",
    "Đã giao": "#22C55E",
    "Huỷ": "#EF4444",
  };
  return fallbacks[trangThai] || "#6B7280";
}

/**
 * Helper: tạo Tailwind class cho badge trạng thái dựa trên màu hex
 */
export function getStatusBadgeStyle(mau: string) {
  // Parse hex → rgba với opacity 10% cho bg
  const hex = mau.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    color: mau,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
}

/**
 * Helper: tạo style cho solid badge (trong notification)
 */
export function getStatusBadgeSolidStyle(mau: string) {
  return {
    backgroundColor: mau,
    color: "#FFFFFF",
  };
}
