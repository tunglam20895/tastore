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
  soLuong: number
}

export type CartItem = {
  id: string
  ten: string
  giaGoc: number
  phanTramGiam: number | null
  giaHienThi: number
  anhURL: string
  soLuong: number
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

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}
