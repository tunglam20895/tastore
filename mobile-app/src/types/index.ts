export type SizeItem = {
  ten: string;
  soLuong: number;
};

export type SanPham = {
  id: string;
  ten: string;
  giaGoc: number;
  phanTramGiam: number | null;
  giaHienThi: number;
  anhURL: string;
  moTa: string;
  danhMuc: string;
  conHang: boolean;
  soLuong: number;
  sizes: SizeItem[];
};

export type CartItem = {
  id: string;
  ten: string;
  giaGoc: number;
  phanTramGiam: number | null;
  giaHienThi: number;
  anhURL: string;
  soLuong: number;
  sizeChon: string | null;
  sizes?: SizeItem[];
};

export type DonHang = {
  id: string;
  tenKH: string;
  sdt: string;
  diaChi: string;
  sanPham: CartItem[];
  tongTien: number;
  thoiGian: string;
  trangThai: 'Mới' | 'Chốt để lên đơn' | 'Đã lên đơn' | 'Đang xử lý' | 'Đã giao' | 'Huỷ';
  maGiamGia?: string;
  giaTriGiam: number;
  nguoiXuLy: string;
};

export type DanhMuc = {
  id: string;
  tenDanhMuc: string;
};

export type CaiDat = {
  logoURL: string;
  tenShop: string;
  sdt: string;
  diaChi: string;
  email: string;
};

export type MaGiamGia = {
  id: string;
  ma: string;
  loai: 'phan_tram' | 'so_tien';
  giaTri: number;
  giaTriToiDa: number | null;
  donHangToiThieu: number;
  soLuong: number;
  daDung: number;
  conHieuLuc: boolean;
  ngayHetHan: string | null;
  createdAt: string;
};

export type KhachHang = {
  sdt: string;
  ten: string;
  tongDon: number;
  tongDoanhThu: number;
  trangThai: string;
  ghiChu?: string;
  createdAt: string;
  updatedAt: string;
};

export type TrangThaiKH = {
  id: string;
  ten: string;
  mau: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type NhanVien = {
  id: string;
  ten: string;
  username: string;
  quyen: string[];
  conHoatDong: boolean;
  luong: number;
  createdAt: string;
  updatedAt: string;
};

export type TrangThaiDH = {
  key: string;
  ten: string;
  mau: string;
  thuTu?: number;
};

export type OrderNotif = {
  id: string;
  loai: 'don_moi' | 'chuyen_trang_thai';
  donHangId: string;
  tenKH: string;
  tenSP: string;
  tongTien?: number;
  nguoiXuLy?: string;
  trangThaiCu?: string;
  trangThaiMoi: string;
  daDoc: boolean;
  thoiGian: string;
};

export type AuthSession = {
  role: 'admin' | 'staff';
  adminToken?: string;
  staffToken?: string;
  staffQuyen?: string[];
  staffTen?: string;
  staffId?: string;
};

export const ALL_QUYEN = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'san-pham',     label: 'Sản phẩm' },
  { key: 'don-hang',     label: 'Đơn hàng' },
  { key: 'khach-hang',   label: 'Khách hàng' },
  { key: 'ma-giam-gia',  label: 'Mã giảm giá' },
] as const;

export const DEFAULT_TRANG_THAI_DH: TrangThaiDH[] = [
  { key: 'Mới', ten: 'Mới', mau: '#3B82F6', thuTu: 1 },
  { key: 'Chốt để lên đơn', ten: 'Chốt để lên đơn', mau: '#8B5CF6', thuTu: 2 },
  { key: 'Đã lên đơn', ten: 'Đã lên đơn', mau: '#14B8A6', thuTu: 3 },
  { key: 'Đang xử lý', ten: 'Đang xử lý', mau: '#F59E0B', thuTu: 4 },
  { key: 'Đã giao', ten: 'Đã giao', mau: '#22C55E', thuTu: 5 },
  { key: 'Huỷ', ten: 'Huỷ', mau: '#A8705F', thuTu: 6 },
];

export const QUICK_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '36', '37', '38', '39', '40', '41', '42',
];
