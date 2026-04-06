export type SanPham = {
  id: string;
  ten: string;
  gia: number;
  anhURL: string;
  moTa: string;
  danhMuc: string;
  conHang: boolean;
};

export type DonHang = {
  id: string;
  tenKH: string;
  sdt: string;
  diaChi: string;
  sanPham: CartItem[];
  tongTien: number;
  thoiGian: string;
  trangThai: "Mới" | "Đang xử lý" | "Đã giao" | "Huỷ";
};

export type CartItem = {
  id: string;
  ten: string;
  gia: number;
  anhURL: string;
  soLuong: number;
};

export type CaiDat = {
  logoURL: string;
  tenShop: string;
  sdt: string;
  diaChi: string;
  email: string;
};

export type DanhMuc = {
  id: string;
  tenDanhMuc: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
