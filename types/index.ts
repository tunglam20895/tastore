export type SizeItem = {
  ten: string
  soLuong: number
}

export type SanPham = {
  id: string
  ten: string
  giaGoc: number
  phanTramGiam: number | null
  giaHienThi: number
  anhURL: string
  moTa: string
  danhMuc: string
  conHang: boolean
  soLuong: number        // tổng tồn kho (= sum(sizes.soLuong) khi có sizes)
  sizes: SizeItem[]      // [] nếu không quản lý theo size
}

export type CartItem = {
  id: string
  ten: string
  giaGoc: number
  phanTramGiam: number | null
  giaHienThi: number
  anhURL: string
  soLuong: number
  sizeChon: string | null  // size đã chọn, null nếu sản phẩm không có size
}

export type DonHang = {
  id: string
  tenKH: string
  sdt: string
  diaChi: string
  sanPham: CartItem[]
  tongTien: number
  thoiGian: string
  trangThai: 'Mới' | 'Đang xử lý' | 'Đã giao' | 'Huỷ'
  maGiamGia?: string
  giaTriGiam: number
}

export type DanhMuc = {
  id: string
  tenDanhMuc: string
}

export type CaiDat = {
  logoURL: string
  tenShop: string
  sdt: string
  diaChi: string
  email: string
}

export type MaGiamGia = {
  id: string
  ma: string
  loai: 'phan_tram' | 'so_tien'
  giaTri: number
  giaTriToiDa: number | null
  donHangToiThieu: number
  soLuong: number
  daDung: number
  conHieuLuc: boolean
  ngayHetHan: string | null
  createdAt: string
}

export type KhachHang = {
  sdt: string
  ten: string
  tongDon: number
  tongDoanhThu: number
  trangThai: string
  ghiChu?: string
  createdAt: string
  updatedAt: string
}

export type TrangThaiKH = {
  id: string
  ten: string
  mau: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export type NhanVien = {
  id: string
  ten: string
  username: string
  quyen: string[]
  conHoatDong: boolean
  createdAt: string
  updatedAt: string
}

export const ALL_QUYEN = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'san-pham',     label: 'Sản phẩm' },
  { key: 'don-hang',     label: 'Đơn hàng' },
  { key: 'khach-hang',   label: 'Khách hàng' },
  { key: 'ma-giam-gia',  label: 'Mã giảm giá' },
] as const
