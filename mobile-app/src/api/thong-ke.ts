import { apiClient } from './client';

export type MobileDashboardStats = {
  doanhThu: {
    homNay: number;
    thangNay: number;
    thangTruoc: number;
    tongCong: number;
    phanTramTangTruong: number | null;
  };
  donHang: {
    tongCong: number;
    homNay: number;
    moiChua: number;
    choTotLenDon: number;
    daLenDon: number;
    dangXuLy: number;
    daGiao: number;
    huy: number;
    tiLeHuy: number;
  };
  khachHang: {
    tongSo: number;
    tongDoanhThu: number;
    topKhachHang: { ten: string; sdt: string; tongDon: number; tongDoanhThu: number }[];
  };
  sanPham: {
    dangBan: number;
    hetHang: number;
    topBanChay: { ten: string; soLuong: number }[];
    topDanhMuc: { ten: string; soLuong: number }[];
  };
  tracking: {
    homNay: number;
    thangNay: number;
    tongCong: number;
    chartData: { ngay: string; luot: number }[];
  };
  donHangChart: { ngay: string; don: number }[];
  chartTheoThang: { thang: string; doanhThu: number; soDon: number }[];
};

export async function getDashboardStats(params?: { tu_ngay?: string; den_ngay?: string }) {
  const res = await apiClient.get('/api/thong-ke', { params });
  const body = res.data as any;
  return body?.data as MobileDashboardStats;
}
