# CLAUDE.md — TRANG ANH STORE

## Tổng quan dự án
Website bán hàng thời trang nữ cao cấp "TRANG ANH STORE".
**Stack**: Next.js 14.2.35 (App Router) + **Supabase PostgreSQL** + **Supabase Storage** + Google Sheets (append-only) + Telegram Bot + **Qwen AI (DashScope)** (`qwen-plus`).
**Deploy**: Vercel (free tier).

**Mobile App**: React Native (Expo SDK 54) + **expo-router** + **Zustand** + **React Query** + **Axios** + **expo-notifications** + **react-native-gifted-charts**.
**Mobile Stack**: React Native 0.81.5 (new arch) + expo-router 6 + zustand 5 + @tanstack/react-query 5 + react-native-gifted-charts.
**Mobile Features**: Admin-only (không có trang bán hàng). Hỗ trợ Admin + Staff login với phân quyền.

---

## Cấu trúc thư mục

```
tranh-anh-store/
├── app/
│   ├── page.tsx                        # Trang chủ — HeroSection + ProductGrid (Suspense)
│   ├── layout.tsx                      # Root layout — SettingsProvider + CartProvider + ToastProvider + TrackingPixel + FlyToCartAnimation
│   ├── globals.css                     # CSS variables + Tailwind layers + component classes
│   ├── (shop)/                         # Route group cho shop (không có prefix)
│   │   ├── layout.tsx                  # Header + Footer + TrangThaiDHProvider wrapper
│   │   ├── page.tsx                    # HomePage (redirect tới /)
│   │   ├── san-pham/[id]/page.tsx      # Chi tiết sản phẩm — size selector, qty, add-to-cart
│   │   ├── gio-hang/page.tsx           # Giỏ hàng — CartItem list, order summary, empty state
│   │   ├── dat-hang/page.tsx           # Checkout — coupon validation, order summary, OrderForm
│   │   └── tra-cuu-don-hang/page.tsx   # Tra cứu đơn hàng — nhập SĐT, xem lịch sử đơn (public)
│   ├── admin/
│   │   ├── layout.tsx                  # Bọc AdminNav + TrangThaiDHProvider
│   │   ├── login/page.tsx              # Đăng nhập — Admin/Staff tabs, full-page SVG spinner loading
│   │   ├── dashboard/page.tsx          # Thống kê KPIs + đơn theo NV/KH + lương nhân viên
│   │   ├── san-pham/page.tsx           # Quản lý SP — filter, pagination, StockBadge, sizes
│   │   ├── don-hang/page.tsx           # Quản lý đơn — filter, bulk select/status, export Excel
│   │   ├── khach-hang/page.tsx         # CRM khách hàng — filter trạng thái, modal chi tiết
│   │   ├── ma-giam-gia/page.tsx        # Quản lý mã giảm giá — CRUD, toggle, generate code
│   │   ├── nhan-vien/page.tsx          # Quản lý nhân viên — CRUD, phân quyền, lương, password hash
│   │   └── cai-dat/page.tsx            # 2-column layout: trái=shop info, phải=trạng thái ĐH+KH
│   └── api/
│       ├── authenticate/route.ts       # POST login — Admin (password) + Staff (username+password, JWT)
│       ├── logout/route.ts             # POST logout — clear all auth cookies
│       ├── cai-dat/route.ts            # GET settings, PUT settings (admin password)
│       ├── danh-muc/route.ts           # GET categories, POST category (san-pham access)
│       ├── san-pham/route.ts           # GET (pagination + filters), POST (admin/staff san-pham access)
│       ├── san-pham/[id]/route.ts      # PUT, DELETE (san-pham access)
│       ├── don-hang/route.ts           # GET (pagination + filters), POST (public — đặt hàng)
│       ├── don-hang/[id]/route.ts      # GET chi tiết, PUT trạng thái + nguoi_xu_ly
│       ├── don-hang/bulk-status/route.ts # POST cập nhật trạng thái hàng loạt
│       ├── don-hang/export-excel/route.ts # POST export Excel từ template → download
│       ├── khach-hang/route.ts         # GET (pagination + search)
│       ├── khach-hang/[sdt]/route.ts   # PUT (trạng thái + ghi chú)
│       ├── ma-giam-gia/route.ts        # GET (pagination), POST
│       ├── ma-giam-gia/[id]/route.ts   # PUT (toggle), DELETE
│       ├── ma-giam-gia/kiem-tra/route.ts # POST kiểm tra mã giảm giá (public)
│       ├── trang-thai-kh/route.ts      # GET danh sách trạng thái KH, POST tạo mới
│       ├── trang-thai-kh/[id]/route.ts # DELETE (kiểm tra đang dùng bởi KH)
│       ├── trang-thai-dh/route.ts      # GET/PUT/POST/DELETE trạng thái đơn hàng + màu (admin only)
│       ├── nhan-vien/route.ts          # GET list, POST tạo (admin only)
│       ├── nhan-vien/[id]/route.ts     # PUT, DELETE (admin only)
│       ├── thong-ke/route.ts           # GET dashboard stats (doanh thu, đơn, tracking, top SP/DM, đơn theo NV, KH, lương)
│       ├── thong-bao/route.ts          # GET lịch sử thông báo, PUT đánh dấu đã đọc (dashboard access)
│       ├── tracking/route.ts           # POST ghi lượt truy cập (fire-and-forget)
│       ├── upload/route.ts             # POST upload ảnh → Supabase Storage
│       ├── generate-mo-ta/route.ts     # POST generate mô tả AI (Qwen)
│       ├── gemini/route.ts             # Deprecated — re-export từ generate-mo-ta
│       ├── telegram/route.ts           # POST webhook Telegram
│       ├── admin-chat/route.ts         # GET context + POST SSE streaming AI chat (Qwen, dashboard access)
│       └── tra-cuu-don-hang/route.ts   # POST tra cứu đơn hàng theo SĐT (public)
├── components/
│   ├── LoadingSpinner.tsx              # SVG logo "TA" xoay 360° — sm/md/lg/full
│   ├── FlyToCartAnimation.tsx          # Animation parabolic bay từ click → giỏ hàng (framer-motion)
│   ├── TrackingPixel.tsx               # Client component ghi lượt xem mỗi page (skip /admin, /api)
│   ├── layout/
│   │   ├── Header.tsx                  # Sticky header — transparent trên hero, solid khi scroll
│   │   └── Footer.tsx                  # bg-espresso, text-cream, 3 cột info
│   ├── shop/
│   │   ├── HeroSection.tsx             # Fullscreen hero + framer-motion text animations
│   │   ├── ProductCard.tsx             # Card portrait 3:4, quick-add on hover, discount badge
│   │   ├── ProductGrid.tsx             # Lưới + search + filter danh mục + PaginationShop
│   │   ├── PaginationShop.tsx          # Phân trang shop (circular buttons)
│   │   ├── CartItem.tsx                # Item giỏ hàng — image, size, qty control, remove
│   │   ├── OrderForm.tsx               # Form đặt hàng — floating labels, submit order
│   │   └── OrderLookupResult.tsx       # Hiển thị kết quả tra cứu đơn hàng — status badges, product thumbnails
│   └── admin/
│       ├── AdminNav.tsx                # Redesigned bell icon, notification dropdown với màu theo trạng thái
│       ├── ProductForm.tsx             # Form thêm/sửa SP — quick-pick sizes, AI mô tả, image upload
│       ├── OrderTable.tsx              # Bảng đơn hàng — checkboxes, inline status select, bulk actions
│       ├── OrderDetailModal.tsx        # Popup chi tiết đơn — status update buttons, customer info
│       ├── Pagination.tsx              # Phân trang admin (with total count)
│       ├── LogoUpload.tsx              # Upload logo → Supabase shop-assets bucket
│       ├── ImageUpload.tsx             # Upload ảnh SP → Supabase san-pham-images bucket
│       ├── AdminChat.tsx               # Floating AI chat panel — SSE streaming, intent analysis, auto-fetch data
│       ├── AdminChatForLayout.tsx      # Layout wrapper — maps URL to page, clears screen data on nav
│       ├── AdminChatWrapper.tsx        # Standalone wrapper with own AdminChatProvider
│       └── ConfirmDialog.tsx           # Reusable confirmation dialog — framer-motion, danger mode
├── contexts/
│   ├── CartContext.tsx                 # Cart state (localStorage), fly animation trigger, CRUD
│   ├── SettingsContext.tsx             # Global shop settings (fetch từ /api/cai-dat)
│   ├── ToastContext.tsx                # Toast notifications (error/success/info, 3.5s auto-dismiss, bottom-right)
│   ├── TrangThaiDHContext.tsx          # Order status colors — fetch từ DB, fallback defaults, helpers
│   └── AdminChatContext.tsx            # Screen data sharing for AI chat — page, filters, stats, items
├── hooks/
│   └── useOrderNotifications.ts        # Realtime don_hang INSERT/UPDATE + polling 60s, unread tracking
├── lib/
│   ├── supabase.ts                     # Server client (service role key, cache: no-store)
│   ├── supabase-client.ts              # Browser client (anon key, dùng cho Realtime)
│   ├── google-sheets.ts                # appendDonHangToSheet() — fire-and-forget
│   ├── telegram.ts                     # sendOrderNotification() — với customer info
│   ├── openrouter.ts                   # generateMoTa() — Qwen DashScope (qwen-plus)
│   ├── ai.ts                           # generateProductDescription() — Qwen DashScope (qwen-plus)
│   ├── gemini.ts                       # Deprecated — Qwen DashScope (qwen-plus)
│   ├── qwen.ts                         # NEW: Qwen DashScope client with streaming + fallback (qwen-plus → qwen3.5-flash → qwen3.5-plus)
│   ├── cloudinary.ts                   # Legacy — không dùng chính
│   ├── auth.ts                         # verifyAdminPassword() + verifyAccess() (admin OR staff token)
│   └── staff-auth.ts                   # hashPassword (PBKDF2), verifyPassword, createStaffToken/verifyStaffToken (HMAC-SHA256)
├── types/index.ts                      # TypeScript types + ALL_QUYEN constant
├── middleware.ts                       # Bảo vệ /admin/* — admin cookie OR staff-token với route-level permission
├── tailwind.config.ts                  # Design tokens (màu sắc, font)
├── next.config.mjs                     # Webpack dev config, image remotePatterns
├── package.json                        # Dependencies
└── supabase/migrations/
    ├── 001_init.sql                    # Base tables: danh_muc, san_pham, don_hang, cai_dat
    ├── 002_add_nguoi_xu_ly.sql         # Adds nguoi_xu_ly column to don_hang
    ├── 002_nhan_vien.sql               # nhan_vien table + updated_at trigger
    ├── 002_so_luong_ma_giam_gia.sql    # so_luong on san_pham, ma_giam_gia table
    ├── 003_khach_hang_crm.sql          # khach_hang + trang_thai_kh + upsert_khach_hang RPC
    ├── 004_sizes.sql                   # Adds sizes TEXT[] to san_pham
    ├── 005_sizes_jsonb.sql             # Converts sizes → JSONB + decrement_size_so_luong RPC
    ├── 006_luot_truy_cap.sql           # luot_truy_cap table + indexes
    ├── 007_luong_nhan_vien.sql         # Adds luong numeric to nhan_vien
    ├── 008_thong_bao.sql               # thong_bao table + triggers (don_moi + status change)
    └── 009_trang_thai_don_hang.sql     # trang_thai_don_hang table + seed 6 default statuses
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Sheets (chỉ append đơn hàng mới, fire-and-forget)
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=             # Giữ nguyên \n khi paste vào Vercel

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Qwen AI (DashScope)
QWEN_API_KEY=

# Admin
ADMIN_PASSWORD=                 # Dùng cho admin login + HMAC signing staff tokens

# Site URL (cho admin-chat internal API calls)
NEXT_PUBLIC_SITE_URL=           # VD: https://tastore.vercel.app

# GHTK Shipping (env đã set, chưa có implementation)
GHTK_TOKEN=
GHTK_OPEN_API_STAGING=
GHTK_OPEN_API_PRODUCT=
```

---

## Supabase Schema

### Bảng `danh_muc`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | text PK | ID danh mục |
| ten_danh_muc | text | Tên danh mục |

### Bảng `san_pham`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | text PK | Auto: sp_{epoch} |
| ten | text | Tên sản phẩm |
| gia_goc | numeric | Giá gốc VNĐ |
| phan_tram_giam | numeric (0-100) | % giảm giá (nullable) |
| anh_url | text | URL ảnh Supabase Storage |
| mo_ta | text | Mô tả sản phẩm |
| danh_muc | text FK | → danh_muc(id) |
| con_hang | boolean | true/false (auto set dựa trên so_luong) |
| so_luong | numeric | Tổng tồn kho |
| sizes | jsonb | Array SizeItem `[{ten, so_luong}]` — empty nếu không quản lý theo size |
| created_at | timestamptz | Auto |

### Bảng `don_hang`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | text PK | Auto: dh_{epoch} |
| ten_kh | text | Tên khách hàng |
| sdt | text | Số điện thoại |
| dia_chi | text | Địa chỉ giao hàng |
| san_pham | jsonb | Array CartItem |
| tong_tien | numeric | Tổng tiền sau giảm |
| ma_giam_gia | text | Mã giảm giá đã dùng (nullable) |
| gia_tri_giam | numeric | Số tiền đã giảm |
| thoi_gian | timestamptz | Auto |
| trang_thai | text | Mới / Chốt để lên đơn / Đã lên đơn / Đang xử lý / Đã giao / Huỷ |
| nguoi_xu_ly | text | Tên người xử lý (Admin, Staff name, hoặc "Chưa có") |

### Bảng `khach_hang`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| sdt | text PK | Số điện thoại |
| ten | text | Tên khách |
| tong_don | numeric | Tổng số đơn |
| tong_doanh_thu | numeric | Tổng giá trị đơn |
| trang_thai | text | FK → trang_thai_kh.ten |
| ghi_chu | text | Ghi chú admin |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### Bảng `trang_thai_kh`
| id | text PK | Auto: tt_{epoch} |
| ten | text | Tên trạng thái (VD: Thân thiết, VIP...) |
| mau | text | Mã màu hex |

### Bảng `ma_giam_gia`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid PK | |
| ma | text UNIQUE | Mã code (uppercase) |
| loai | text | phan_tram / so_tien |
| gia_tri | numeric | Giá trị giảm |
| gia_tri_toi_da | numeric | Giảm tối đa (cho loại %, nullable) |
| don_hang_toi_thieu | numeric | Đơn tối thiểu áp dụng |
| so_luong | numeric | Giới hạn số lần dùng |
| da_dung | numeric | Đã dùng |
| con_hieu_luc | boolean | |
| ngay_het_han | date | Nullable |
| created_at | timestamptz | Auto |

### Bảng `nhan_vien`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid PK | |
| ten | text | Tên hiển thị |
| username | text UNIQUE | Tên đăng nhập |
| password_hash | text | Bcrypt hash |
| quyen | text[] | Array quyền: dashboard, san-pham, don-hang, khach-hang, ma-giam-gia |
| con_hoat_dong | boolean | |
| luong | numeric | Lương tháng (VNĐ) |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### Bảng `cai_dat`
| key | text PK | LogoURL, TenShop, SDT, DiaChi, Email |
| value | text | |

### Bảng `luot_truy_cap`
| id | uuid PK |
| trang | text | URL trang được truy cập |
| user_agent | text | |
| ref | text | Referrer |
| thoi_gian | timestamptz | Auto |

### Bảng `thong_bao` (mới)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid PK | Auto |
| loai | text | 'don_moi' \| 'chuyen_trang_thai' |
| don_hang_id | text | FK tự nhiên → don_hang.id |
| ten_kh | text | Tên khách hàng |
| san_pham_tom_tat | text | Tóm tắt SP trong đơn |
| tong_tien | numeric | Tổng tiền |
| trang_thai_cu | text | Trạng thái cũ (cho chuyen_trang_thai) |
| trang_thai_moi | text | Trạng thái mới |
| nguoi_xu_ly | text | Người thực hiện |
| da_doc | boolean | |
| thoi_gian | timestamptz | Auto |

### Bảng `trang_thai_don_hang` (mới)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| key | text PK | Key định danh (VD: "Mới") |
| ten | text | Tên hiển thị |
| mau | text | Mã màu hex |
| thu_tu | int | Thứ tự hiển thị |

### Supabase Storage buckets
- `san-pham-images` — ảnh sản phẩm (public)
- `shop-assets` — logo shop (public)

### Supabase Triggers
- `trg_notify_don_moi` — Auto INSERT vào `thong_bao` khi `don_hang` INSERT
- `trg_don_hang_status_change` — Auto INSERT vào `thong_bao` khi `don_hang.trang_thai` UPDATE
- `trg_don_hang_insert` — (cũ, có thể bỏ) Auto INSERT thong_bao don_moi

### Supabase RPC functions
- `upsert_khach_hang(p_sdt, p_ten, p_doanh_thu)` — tạo/cập nhật khách hàng khi có đơn
- `decrement_so_luong(product_id, quantity)` — trừ tồn kho không có size
- `decrement_size_so_luong(p_product_id, p_size_name, p_quantity)` — trừ tồn kho theo size

---

## TypeScript Types

```typescript
type SizeItem = { ten: string; soLuong: number }

type SanPham = {
  id: string; ten: string; giaGoc: number
  phanTramGiam: number | null; giaHienThi: number
  anhURL: string; moTa: string; danhMuc: string
  conHang: boolean; soLuong: number
  sizes: SizeItem[]  // [] nếu không quản lý theo size
}

type CartItem = {
  id: string; ten: string; giaGoc: number
  phanTramGiam: number | null; giaHienThi: number
  anhURL: string; soLuong: number; sizeChon: string | null
  sizes?: SizeItem[]
}

type DonHang = {
  id: string; tenKH: string; sdt: string; diaChi: string
  sanPham: CartItem[]; tongTien: number; thoiGian: string
  trangThai: 'Mới' | 'Chốt để lên đơn' | 'Đã lên đơn' | 'Đang xử lý' | 'Đã giao' | 'Huỷ'
  maGiamGia?: string; giaTriGiam: number; nguoiXuLy: string
}

type DanhMuc = { id: string; tenDanhMuc: string }
type CaiDat = { logoURL: string; tenShop: string; sdt: string; diaChi: string; email: string }

type MaGiamGia = {
  id: string; ma: string; loai: 'phan_tram' | 'so_tien'
  giaTri: number; giaTriToiDa: number | null
  donHangToiThieu: number; soLuong: number; daDung: number
  conHieuLuc: boolean; ngayHetHan: string | null; createdAt: string
}

type KhachHang = {
  sdt: string; ten: string; tongDon: number
  tongDoanhThu: number; trangThai: string
  ghiChu?: string; createdAt: string; updatedAt: string
}

type TrangThaiKH = { id: string; ten: string; mau: string }

type NhanVien = {
  id: string; ten: string; username: string
  quyen: string[]; conHoatDong: boolean
  luong: number; createdAt: string; updatedAt: string
}

type TrangThaiDH = { key: string; ten: string; mau: string; thuTu?: number }

type OrderNotif = {
  id: string; loai: 'don_moi' | 'chuyen_trang_thai'
  donHangId: string; tenKH: string; tenSP: string
  tongTien?: number; nguoiXuLy?: string
  trangThaiCu?: string; trangThaiMoi: string
  daDoc: boolean; thoiGian: string
}

type TrangThaiDH = { key: string; ten: string; mau: string; thuTu?: number }

type OrderNotif = {
  id: string; loai: 'don_moi' | 'chuyen_trang_thai'
  donHangId: string; tenKH: string; tenSP: string
  tongTien?: number; nguoiXuLy?: string
  trangThaiCu?: string; trangThaiMoi: string
  daDoc: boolean; thoiGian: string
}

type AdminChatScreenData = {
  page: string; title: string; summary: string
  filters?: string[]; items?: string[]
  stats?: Record<string, string | number>
}

type PaginatedResponse<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number }
type ApiResponse<T> = { success: boolean; data?: T; error?: string }

const ALL_QUYEN = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'san-pham',     label: 'Sản phẩm' },
  { key: 'don-hang',     label: 'Đơn hàng' },
  { key: 'khach-hang',   label: 'Khách hàng' },
  { key: 'ma-giam-gia',  label: 'Mã giảm giá' },
] as const
```

---

## Design System — Feminine Luxury Minimalism

### CSS Variables
```css
--color-cream:    #EDE8DF   /* nền chính */
--color-blush:    #C8A991   /* accent, border */
--color-rose:     #A8705F   /* badge discount, accent đỏ */
--color-espresso: #1A0A04   /* text chính, CTA */
--color-stone:    #4a3028   /* text phụ */
--color-white:    #FFFFFF
```

### Tailwind Custom Colors
```typescript
colors: {
  cream: "var(--color-cream)",
  blush: "var(--color-blush)",
  rose: "var(--color-rose)",
  espresso: "var(--color-espresso)",
  stone: {
    DEFAULT: "var(--color-stone)",
    100: "#ede8df", 200: "#d9c9bc", 300: "#c4a896",
    400: "#7a5a4e", 500: "var(--color-stone)",
    600: "#4a2e24", 700: "#3c2e28", 800: "#2a1f1a", 900: "#1A0A04",
  },
}
```

### Typography
- **Heading**: `Cormorant Garamond` (font-light, tracking-widest)
- **Body/UI**: `DM Sans`

### Reusable CSS Classes (globals.css)
| Class | Mô tả |
|-------|-------|
| `.admin-card` | bg-white, border, rounded-xl, shadow-md |
| `.stat-number` | font-sans, font-bold, tabular-nums |
| `.admin-input` | w-full, border, rounded-lg, focus:border-espresso |
| `.admin-label` | text-xs, uppercase, tracking-wider, text-stone-600 |
| `.btn-primary` | bg-espresso, text-cream, uppercase, tracking-widest, hover:opacity-80 |
| `.input-underline` | border-b, transparent bg, focus:border-espresso |
| `.label-float` | absolute, text-stone-400, transition |
| `.input-group` | relative container, peer-based label float |

---

## Hệ thống xác thực (Two-tier)

### 1. Admin
- **Cách đăng nhập**: Nhập `ADMIN_PASSWORD` env → verify trong `/api/authenticate`
- **Session**: Cookie `admin-auth` (httpOnly, value="true") + `admin-role` (client-readable)
- **Password lưu trữ**: localStorage `admin-password` (để gửi header `x-admin-password`)
- **Quyền**: Full access tất cả routes

### 2. Staff (Nhân viên)
- **Cách đăng nhập**: Username + password → bcrypt verify → tạo JWT token
- **Token**: HMAC-SHA256 signed (Web Crypto), payload `{id, ten, username, quyen[], exp: 24h}`
- **Cookies**: `staff-token` (httpOnly), `staff-quyen` (comma-separated), `staff-ten`
- **Phân quyền**: Granular per-route dựa trên `ALL_QUYEN`
- **Middleware**: Kiểm tra permission theo route segment, redirect về route đầu tiên được phép
- **Routes admin-only** (staff không vào được): `/admin/nhan-vien`, `/admin/cai-dat`

### `verifyAccess(request, requiredQuyen)` flow:
1. Kiểm tra `x-admin-password` header → nếu match ADMIN_PASSWORD → return true
2. Nếu `requiredQuyen` là null → return false (route chỉ dành cho admin)
3. Kiểm tra `staff-token` cookie → verify → kiểm tra `quyen.includes(requiredQuyen)`

---

## Luồng hoàn chỉnh

1. **Khách truy cập** → TrackingPixel ghi `luot_truy_cap` (fire-and-forget)
2. **Admin thêm sản phẩm** → `giaGoc` + `phanTramGiam` + sizes → Supabase, ảnh → Supabase Storage
3. **Khách xem sản phẩm** → badge giảm giá, giá gạch ngang, chọn size, quick-add từ hover
4. **Fly-to-cart animation** → Parabolic motion từ vị trí click → icon giỏ hàng (framer-motion)
5. **Giỏ hàng** → `giaHienThi` lưu tại thời điểm add-to-cart, tăng/giảm số lượng, xóa
6. **Đặt hàng** → form floating label → nhập mã giảm giá → submit
7. **Backend xử lý đơn** (fire-and-forget):
   - Lưu đơn hàng vào Supabase
   - Increment `da_dung` trên `ma_giam_gia`
   - Decrement tồn kho qua RPC
   - Upsert `khach_hang` qua RPC `upsert_khach_hang`
   - Gửi thông báo Telegram
   - Append vào Google Sheets
8. **Admin thấy bell đỏ** → click → popup chi tiết đơn → cập nhật trạng thái
9. **Đơn hàng "Chốt để lên đơn"** → Export Excel từ template → auto chuyển status "Đã lên đơn"

---

## API Routes Summary

| Route | Methods | Auth | Tables |
|-------|---------|------|--------|
| `/api/authenticate` | POST | None (login) | `nhan_vien` |
| `/api/logout` | POST | None | None |
| `/api/cai-dat` | GET, PUT | PUT: admin password | `cai_dat` |
| `/api/danh-muc` | GET, POST | POST: `san-pham` access | `danh_muc` |
| `/api/san-pham` | GET, POST | GET: public; POST: `san-pham` access | `san_pham` |
| `/api/san-pham/[id]` | PUT, DELETE | `san-pham` access | `san_pham` |
| `/api/don-hang` | GET, POST | GET: `don-hang` access; POST: public | `don_hang`, `ma_giam_gia`, `khach_hang` |
| `/api/don-hang/[id]` | GET, PUT | `don-hang` access | `don_hang` |
| `/api/don-hang/bulk-status` | POST | `don-hang` access | `don_hang` |
| `/api/don-hang/export-excel` | POST | `don-hang` access | `don_hang` |
| `/api/khach-hang` | GET | `khach-hang` access | `khach_hang` |
| `/api/khach-hang/[sdt]` | PUT | `khach-hang` access | `khach_hang` |
| `/api/ma-giam-gia` | GET, POST | `ma-giam-gia` access | `ma_giam_gia` |
| `/api/ma-giam-gia/[id]` | PUT, DELETE | `ma-giam-gia` access | `ma_giam_gia` |
| `/api/ma-giam-gia/kiem-tra` | POST | None (public) | `ma_giam_gia` |
| `/api/trang-thai-kh` | GET, POST | POST: admin password | `trang_thai_kh` |
| `/api/trang-thai-kh/[id]` | DELETE | admin password | `trang_thai_kh`, `khach_hang` |
| `/api/trang-thai-dh` | GET, PUT, POST, DELETE | PUT/POST/DELETE: admin password | `trang_thai_don_hang` |
| `/api/nhan-vien` | GET, POST | **Admin only** | `nhan_vien` |
| `/api/nhan-vien/[id]` | PUT, DELETE | **Admin only** | `nhan_vien` |
| `/api/thong-ke` | GET | `dashboard` access | `don_hang`, `san_pham`, `luot_truy_cap`, `danh_muc`, `nhan_vien`, `khach_hang` |
| `/api/thong-bao` | GET, PUT | `dashboard` access | `thong_bao` |
| `/api/tracking` | POST | None (public) | `luot_truy_cap` |
| `/api/upload` | POST | `san-pham` access | Supabase Storage |
| `/api/generate-mo-ta` | POST | `san-pham` access | None |
| `/api/telegram` | POST | None (webhook) | None |
| `/api/admin-chat` | GET, POST | `dashboard` access | Internal API calls (thong-ke, don-hang, san-pham, etc.) |
| `/api/tra-cuu-don-hang` | POST | None (public) | `don_hang` |

---

## Conventions

### Naming
- **Component**: PascalCase → `ProductCard.tsx`
- **File/folder**: kebab-case → `san-pham/`
- **Function**: camelCase → `computeGiaHienThi()`
- **Type/Interface**: PascalCase → `SanPham`, `DonHang`
- **DB columns**: snake_case → `gia_goc`, `ten_kh`, `trang_thai`

### Pagination pattern (server-side)
Tất cả list trong admin dùng cùng pattern:
```tsx
const loadData = useCallback((p, ...filters) => { /* fetch với range */ }, []); // deps rỗng
useEffect(() => { loadData(page, ...filters); }, [page, ...filterStates, refreshKey]);
```

### Error handling
- Tất cả API route: try/catch, trả về `{ success: boolean, data?, error? }`
- Client: dùng `useToast()` → `showToast(message, 'error'|'success')` thay vì `alert()`
- Google Sheets + Telegram: fire-and-forget, không block response
- Tracking: luôn trả 200, không block
- **API silent fail**: `/api/trang-thai-dh`, `/api/trang-thai-kh`, `/api/thong-bao` trả default data thay vì 500 khi bảng chưa tồn tại

### Security
- Middleware bảo vệ `/admin/*` bằng cookie `admin-auth` OR `staff-token`
- Routes POST/PUT/DELETE trong admin verify header `x-admin-password` hoặc staff token
- Đăng nhập dùng `window.location.replace()` (hard navigation)
- Không expose API keys ra client component
- Staff token: HMAC-SHA256 (Web Crypto), PBKDF2 password hashing, 24h expiry

### Notifications
- `useToast()` — hook từ `ToastContext`, available tại root layout
- `useOrderNotifications()` — hook Supabase Realtime (lắng nghe trực tiếp `don_hang` INSERT/UPDATE) + polling 60s
- **Realtime ưu tiên**: Lắng nghe `don_hang` trực tiếp thay vì qua trigger `thong_bao` → nhận thông báo NGAY LẬP TỨC (~50-150ms)
- **Bảng `thong_bao`**: Lưu lịch sử thông báo, trạng thái đã đọc, dùng cho sync polling

### Loading States
- `LoadingSpinner` component — SVG logo "TA" xoay 360°, 4 kích thước (sm/md/lg/full)
- Login page: full-page spinner khi đang chờ authenticate
- Dashboard: full-page spinner khi initial load, skeleton cho refresh
- ProductGrid/ProductDetail: spinner section + label "Đang tải sản phẩm..."
- Admin pages: spinner section + label "Đang tải..."
- Button-level: spinner nhỏ inline cho các action (xóa, toggle, export)

### Route Groups
- `(shop)/` — Shop pages với Header + Footer (không có prefix URL)
- `admin/` — Admin pages với AdminNav + ToastProvider + TrangThaiDHProvider

---

## Chức năng chính

### Shop (khách hàng)
- **Hero**: Fullscreen banner với framer-motion text animations
- **ProductGrid**: Tìm kiếm, filter danh mục, server-side pagination, chỉ hiện `con_hang=true`
- **ProductCard**: Ảnh portrait 3:4, badge giảm giá, low-stock indicator, quick-add on hover
- **Product Detail**: Sticky image, size selector (out-of-stock gạch chéo), qty control, "Thêm giỏ" + "Mua ngay"
- **Giỏ hàng**: CartItem với image, size, qty control, remove, order summary
- **Checkout**: Floating label form, coupon validation (real-time), order summary
- **Fly-to-cart**: Parabolic animation từ vị trí click → giỏ hàng (framer-motion + flash effect)
- **Tracking**: Ghi lượt truy cập mỗi page (fire-and-forget)
- **Tra cứu đơn hàng** (mới): `/tra-cuu-don-hang` — khách nhập SĐT → xem lịch sử đơn hàng, status badges, sản phẩm, tổng tiền (public, không cần đăng nhập)

### Admin
- **Dashboard**:
  - 4 KPI lớn: Doanh thu tháng, Đơn hôm nay, Lượt truy cập hôm nay, Sản phẩm đang bán
  - 8 stat nhỏ: Doanh thu hôm nay/tháng trước/tăng trưởng/tổng, Đơn mới/Chốt lên đơn/Đang xử lý/Huỷ
  - **Đơn hàng theo trạng thái**: Progress bars 6 trạng thái với màu riêng
  - **Đơn hàng theo nhân viên**: Avatar + progress bar + số đơn + doanh thu mỗi người
  - **Khách hàng & Doanh thu từ KH**: Tổng KH, tổng doanh thu, top 5 KH theo doanh thu
  - **Nhân viên & Chi phí lương**: Tổng NV, tổng lương chi trả, tỉ lệ hoạt động, lợi nhuận ước tính
  - 2 BarChart (recharts): Lượt truy cập 7 ngày + Đơn hàng 7 ngày
  - Top sản phẩm bán chạy + Top danh mục bán chạy
  - Tổng quan kho hàng (progress bars)
  - Auto-refresh mỗi 60s

- **Sản phẩm**: CRUD, upload ảnh, quick-pick sizes (XS-XXL, 36-42), generate mô tả AI, filter, server-side pagination
- **Đơn hàng**: Filter đa chiều, bulk select + bulk status, export Excel từ template
- **Khách hàng**: CRM tự động từ đơn hàng, filter trạng thái, modal chi tiết + lịch sử đơn
- **Mã giảm giá**: CRUD, toggle on/off, generate code ngẫu nhiên
- **Nhân viên**: CRUD, phân quyền, **lương** (VNĐ/tháng), password hash, active toggle
- **Cài đặt**: **2-column layout** — trái=thông tin shop (logo+tên+SĐT+địa chỉ+email), phải=trạng thái đơn hàng (grid 3 cột, đổi màu)+trạng thái khách hàng (pills)
- **Bell notification**: Redesigned — bell icon đẹp hơn với shake animation, dropdown phân loại màu theo trạng thái, hiển thị chi tiết:
  - 📦 Đơn mới: nền xanh nhạt, tên KH, mã đơn, tổng tiền
  - 🔄 Chuyển trạng thái: nền màu theo trạng thái, badge cũ→mới, tên nhân viên xử lý
  - Realtime từ `don_hang` INSERT/UPDATE → nhận thông báo NGAY LẬP TỨC
- **🤖 AI Chat Assistant** (mới):
  - Floating button (bottom-right, espresso) → slide-in side panel (420px)
  - SSE streaming từ Qwen AI (`qwen-plus` → fallback `qwen3.5-flash` → `qwen3.5-plus`)
  - Intent analysis: tự động phát hiện query về doanh thu, đơn hàng, sản phẩm, KH, NV
  - Auto-fetch fresh data từ internal APIs trước khi trả lời
  - Kết hợp dữ liệu API + screen context (filter, stats, items đang hiển thị)
  - Context fetch cho từng trang (dashboard, san-pham, don-hang, khach-hang, nhan-vien)
  - Hỗ trợ tìm đơn/cụ thể theo ID (`dh_*`) hoặc SĐT khách hàng

---

## Migration Checklist (cần chạy trên Supabase)

1. **`007_luong_nhan_vien.sql`** — Thêm cột `luong` vào `nhan_vien`
2. **`008_thong_bao.sql`** — Tạo bảng `thong_bao` + triggers auto notification
3. **`009_trang_thai_don_hang.sql`** — Tạo bảng `trang_thai_don_hang` + seed 6 trạng thái

**Bật Realtime cho bảng `don_hang`**: Database → Replication → bật toggle Realtime (INSERT + UPDATE)

---

## Dependencies

### Production
| Package | Version | Mục đích |
|---------|---------|----------|
| `next` | 14.2.35 | Framework |
| `react` / `react-dom` | ^18 | UI library |
| `@supabase/supabase-js` | ^2.101.1 | Database client |
| `framer-motion` | ^12.38.0 | Animations (hero, fly-to-cart, confirm dialog) |
| `recharts` | ^3.8.1 | Dashboard charts |
| `exceljs` | ^4.4.0 | Excel export |
| `@types/exceljs` | ^0.5.3 | Excel types |
| `googleapis` | ^144.0.0 | Google Sheets append |
| `xlsx` | ^0.18.5 | Excel utilities |
| `cloudinary` | ^2.5.0 | Legacy (không dùng chính) |
| `@google/generative-ai` | ^0.21.0 | Legacy (không dùng chính) |

### Dev
| Package | Version |
|---------|---------|
| `typescript` | ^5 |
| `tailwindcss` | ^3.4.1 |
| `eslint` / `eslint-config-next` | ^8 / 14.2.35 |
| `postcss` | ^8 |
| `@types/node` | ^20 |
| `@types/react` / `@types/react-dom` | ^18 |

---

## Ghi chú quan trọng

1. **Supabase Storage**: buckets phải set public policy để ảnh hiển thị không cần auth
2. **GOOGLE_PRIVATE_KEY**: Khi paste vào Vercel env giữ nguyên `\n`
3. **Google Sheets** chỉ là sao lưu — không dùng làm database chính
4. **giaHienThi** tính và lưu vào CartItem tại thời điểm add-to-cart, không tính lại khi đặt
5. **Admin auth**: Cookie httpOnly 24h + localStorage cho header `x-admin-password`
6. **stone color scale** đã được customize — không dùng Tailwind mặc định
7. **Hero image**: `/public/hero.jpg` — ảnh tĩnh local
8. **Sizes**: JSONB `[{ten, so_luong}]` — empty array nếu không quản lý theo size
9. **Excel export**: Dùng template `template/ExcelTemplateVi.xlsx`, copy formatting từ header row
10. **AI models**: `qwen-plus` (DashScope) cho generateMoTa và generateProductDescription; `lib/qwen.ts` có model fallback chain: `qwen-plus` → `qwen3.5-flash` → `qwen3.5-plus`
11. **Staff token**: HMAC-SHA256 với Web Crypto, PBKDF2 hashing
12. **predev/prebuild**: Tự động xóa `.next` folder trước khi dev/build
13. **Notification realtime**: Lắng nghe trực tiếp `don_hang` INSERT/UPDATE → không chờ trigger `thong_bao` → nhận thông báo trong ~50-150ms
14. **ToastProvider** đã chuyển từ AdminNav lên root layout → có thể dùng ở mọi nơi
15. **API silent fail**: Các API có bảng mới (`thong_bao`, `trang_thai_don_hang`, `trang_thai_kh`) trả default data thay vì 500 khi bảng chưa tồn tại
16. **Admin AI Chat**: Sử dụng internal API calls (fetch với `x-admin-password` header) thay vì query Supabase trực tiếp → đảm bảo data consistency
17. **Admin AI Chat**: SSE streaming pattern với `__META__:fetching_data` signal và `[DONE]` terminator
18. **Admin layout**: `TrangThaiDHProvider → AdminChatProvider → AdminNav → children + AdminChatForLayout`
19. **Shop layout**: `TrangThaiDHProvider → Header → main → Footer`
20. **GHTK Shipping**: Env vars (`GHTK_TOKEN`, `GHTK_OPEN_API_STAGING`, `GHTK_OPEN_API_PRODUCT`) đã set nhưng chưa có implementation code
21. **Tra cứu đơn hàng**: Public endpoint, không cần auth, trả về tối đa 50 đơn gần nhất theo SĐT
