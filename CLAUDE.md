# CLAUDE.md — TRANH ANH STORE

## Tổng quan dự án
Website bán hàng thời trang nữ cao cấp "TRANH ANH STORE".
**Stack**: Next.js 14.2.35 (App Router) + **Supabase PostgreSQL** + **Supabase Storage** + Google Sheets (append-only) + Telegram Bot + OpenRouter AI (`stepfun/step-3.5-flash:free` / `qwen/qwen3.6-plus:free`).
**Deploy**: Vercel (free tier).

---

## Cấu trúc thư mục

```
tranh-anh-store/
├── app/
│   ├── page.tsx                        # Trang chủ — HeroSection + ProductGrid (Suspense)
│   ├── layout.tsx                      # Root layout — SettingsProvider + CartProvider + TrackingPixel + FlyToCartAnimation
│   ├── globals.css                     # CSS variables + Tailwind layers + component classes
│   ├── san-pham/
│   │   └── [id]/page.tsx              # Chi tiết sản phẩm — size selector, qty, add-to-cart + fly animation, breadcrumb
│   ├── gio-hang/page.tsx               # Giỏ hàng — CartItem list, order summary, empty state
│   ├── dat-hang/page.tsx               # Checkout — coupon validation, order summary, OrderForm
│   ├── admin/
│   │   ├── layout.tsx                  # Bọc AdminNav (cung cấp ToastProvider)
│   │   ├── login/page.tsx              # Đăng nhập — Admin/Staff tabs, hard redirect (window.location.replace)
│   │   ├── dashboard/page.tsx          # Thống kê KPIs + 2 BarChart (7 ngày) + top SP/DM + kho overview
│   │   ├── san-pham/page.tsx           # Quản lý SP — filter (search, DM, tồn kho, con_hang), server-side pagination, StockBadge, sizes display
│   │   ├── don-hang/page.tsx           # Quản lý đơn — filter đa chiều, bulk select + bulk status, export Excel (template)
│   │   ├── khach-hang/page.tsx         # CRM khách hàng — filter trạng thái, modal chi tiết + lịch sử đơn
│   │   ├── ma-giam-gia/page.tsx        # Quản lý mã giảm giá — CRUD, toggle on/off, generate code ngẫu nhiên
│   │   ├── nhan-vien/page.tsx          # Quản lý nhân viên — CRUD, phân quyền (ALL_QUYEN), password hash, active toggle
│   │   └── cai-dat/page.tsx            # Cài đặt shop (logo, info) + quản lý trạng thái KH tùy chỉnh
│   └── api/
│       ├── authenticate/route.ts       # POST login — Admin (password) + Staff (username+password, JWT token)
│       ├── logout/route.ts             # POST logout — clear all auth cookies
│       ├── cai-dat/route.ts            # GET settings, PUT settings (admin password)
│       ├── danh-muc/route.ts           # GET categories, POST category (san-pham access)
│       ├── san-pham/route.ts           # GET (pagination + filters), POST (admin/staff san-pham access)
│       ├── san-pham/[id]/route.ts      # PUT, DELETE (san-pham access)
│       ├── don-hang/route.ts           # GET (pagination + filters), POST (public — đặt hàng)
│       ├── don-hang/[id]/route.ts      # GET chi tiết, PUT trạng thái + nguoi_xu_ly
│       ├── don-hang/bulk-status/route.ts # POST cập nhật trạng thái hàng loạt
│       ├── don-hang/export-excel/route.ts # POST export Excel từ template → download, auto chuyển "Đã lên đơn"
│       ├── khach-hang/route.ts         # GET (pagination + search)
│       ├── khach-hang/[sdt]/route.ts   # PUT (trạng thái + ghi chú)
│       ├── ma-giam-gia/route.ts        # GET (pagination), POST
│       ├── ma-giam-gia/[id]/route.ts   # PUT (toggle), DELETE
│       ├── ma-giam-gia/kiem-tra/route.ts # POST kiểm tra mã giảm giá (public)
│       ├── trang-thai-kh/route.ts      # GET danh sách trạng thái KH, POST tạo mới
│       ├── trang-thai-kh/[id]/route.ts # DELETE (kiểm tra đang dùng bởi KH)
│       ├── nhan-vien/route.ts          # GET list, POST tạo (admin only)
│       ├── nhan-vien/[id]/route.ts     # PUT, DELETE (admin only)
│       ├── thong-ke/route.ts           # GET dashboard stats (doanh thu, đơn, tracking, top SP/DM)
│       ├── tracking/route.ts           # POST ghi lượt truy cập (fire-and-forget)
│       ├── upload/route.ts             # POST upload ảnh → Supabase Storage
│       ├── generate-mo-ta/route.ts     # POST generate mô tả AI (OpenRouter)
│       ├── gemini/route.ts             # Deprecated — re-export từ generate-mo-ta
│       └── telegram/route.ts           # POST webhook Telegram (xử lý /start, /help)
├── components/
│   ├── FlyToCartAnimation.tsx          # Animation parabolic bay từ click → giỏ hàng (framer-motion)
│   ├── TrackingPixel.tsx               # Client component ghi lượt xem mỗi page (skip /admin, /api)
│   ├── layout/
│   │   ├── Header.tsx                  # Sticky header — transparent trên hero, solid khi scroll, centered shop name
│   │   └── Footer.tsx                  # bg-espresso, text-cream, 3 cột info
│   ├── shop/
│   │   ├── HeroSection.tsx             # Fullscreen hero + framer-motion text animations
│   │   ├── ProductCard.tsx             # Card portrait 3:4, quick-add on hover, discount badge, low-stock indicator
│   │   ├── ProductGrid.tsx             # Lưới + search + filter danh mục + PaginationShop
│   │   ├── PaginationShop.tsx          # Phân trang shop (circular buttons)
│   │   ├── CartItem.tsx                # Item giỏ hàng — image, size, qty control, remove
│   │   └── OrderForm.tsx               # Form đặt hàng — floating labels, submit order
│   └── admin/
│       ├── AdminNav.tsx                # Navbar admin — permission-based nav items, bell notification dropdown, logout
│       ├── ProductForm.tsx             # Form thêm/sửa SP — quick-pick sizes, AI mô tả, image upload
│       ├── OrderTable.tsx              # Bảng đơn hàng — checkboxes, inline status select, bulk actions
│       ├── OrderDetailModal.tsx        # Popup chi tiết đơn — status update buttons, customer info
│       ├── Pagination.tsx              # Phân trang admin (with total count)
│       ├── LogoUpload.tsx              # Upload logo → Supabase shop-assets bucket
│       └── ImageUpload.tsx             # Upload ảnh SP → Supabase san-pham-images bucket
├── contexts/
│   ├── CartContext.tsx                 # Cart state (localStorage), fly animation trigger, CRUD operations
│   ├── SettingsContext.tsx             # Global shop settings (fetch từ /api/cai-dat), refresh via custom event
│   └── ToastContext.tsx                # Toast notifications (error/success, 4s auto-dismiss, bottom-right)
├── hooks/
│   └── useOrderNotifications.ts        # Bell icon: Supabase Realtime INSERT + polling 60s, unread tracking
├── lib/
│   ├── supabase.ts                     # Server client (service role key, cache: no-store)
│   ├── supabase-client.ts              # Browser client (anon key, dùng cho Realtime)
│   ├── google-sheets.ts                # appendDonHangToSheet() — fire-and-forget
│   ├── telegram.ts                     # sendOrderNotification() — với customer info
│   ├── openrouter.ts                   # generateMoTa() — stepfun/step-3.5-flash:free
│   ├── ai.ts                           # generateProductDescription() — qwen/qwen3.6-plus:free
│   ├── gemini.ts                       # Deprecated — gọi OpenRouter thay vì Gemini
│   ├── cloudinary.ts                   # Legacy — không dùng chính
│   ├── auth.ts                         # verifyAdminPassword() + verifyAccess() (admin OR staff token)
│   └── staff-auth.ts                   # hashPassword (PBKDF2), verifyPassword, createStaffToken/verifyStaffToken (HMAC-SHA256, Web Crypto)
├── types/index.ts                      # TypeScript types + ALL_QUYEN constant
├── middleware.ts                       # Bảo vệ /admin/* — admin cookie OR staff-token với route-level permission
├── tailwind.config.ts                  # Design tokens (màu sắc, font)
├── next.config.mjs                     # Webpack dev config, image remotePatterns
├── package.json                        # Dependencies
└── supabase/migrations/
    ├── 001_init.sql                    # Base tables: danh_muc, san_pham, don_hang, cai_dat
    ├── 002_add_nguoi_xu_ly.sql         # Adds nguoi_xu_ly column to don_hang
    ├── 002_nhan_vien.sql               # nhan_vien table + updated_at trigger
    ├── 002_so_luong_ma_giam_gia.sql    # so_luong on san_pham, ma_giam_gia table, decrement_so_luong RPC
    ├── 003_khach_hang_crm.sql          # khach_hang + trang_thai_kh + upsert_khach_hang RPC
    ├── 004_sizes.sql                   # Adds sizes TEXT[] to san_pham
    ├── 005_sizes_jsonb.sql             # Converts sizes → JSONB + decrement_size_so_luong RPC
    └── 006_luot_truy_cap.sql           # luot_truy_cap table + indexes
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

# OpenRouter AI
OPENROUTER_API_KEY=

# Admin
ADMIN_PASSWORD=                 # Dùng cho admin login + HMAC signing staff tokens
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

### Supabase Storage buckets
- `san-pham-images` — ảnh sản phẩm (public)
- `shop-assets` — logo shop (public)

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
  createdAt: string; updatedAt: string
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
- **Session**: Cookie `admin-auth` (httpOnly, value="true") + `admin-role` (client-readable, value="true")
- **Password lưu trữ**: localStorage `admin-password` (để gửi header `x-admin-password`)
- **Quyền**: Full access tất cả routes

### 2. Staff (Nhân viên)
- **Cách đăng nhập**: Username + password → bcrypt verify → tạo JWT token
- **Token**: HMAC-SHA256 signed (Web Crypto), payload chứa `{id, ten, username, quyen[], exp: 24h}`
- **Cookies**: `staff-token` (httpOnly), `staff-quyen` (comma-separated), `staff-ten`
- **Phân quyền**: Granular per-route dựa trên `ALL_QUYEN`
- **Middleware**: Kiểm tra permission theo route segment, redirect về route đầu tiên được phép nếu không có quyền
- **Routes admin-only** (staff không vào được): `/admin/nhan-vien`, `/admin/cai-dat`

### `verifyAccess(request, requiredQuyen)` flow:
1. Kiểm tra `x-admin-password` header → nếu match ADMIN_PASSWORD → return true
2. Nếu `requiredQuyen` là null → return false (route chỉ dành cho admin)
3. Kiểm tra `staff-token` cookie → verify → kiểm tra `quyen.includes(requiredQuyen)`

---

## Luồng hoàn chỉnh

1. **Khách truy cập** → TrackingPixel ghi `luot_truy_cap` (fire-and-forget, skip /admin & /api)
2. **Admin thêm sản phẩm** → `giaGoc` + `phanTramGiam` + sizes → Supabase, ảnh → Supabase Storage
3. **Khách xem sản phẩm** → badge giảm giá, giá gạch ngang, chọn size (nếu có), quick-add từ hover
4. **Fly-to-cart animation** → Parabolic motion từ vị trí click → icon giỏ hàng (framer-motion)
5. **Giỏ hàng** → `giaHienThi` lưu tại thời điểm add-to-cart, tăng/giảm số lượng, xóa
6. **Đặt hàng** → form floating label → nhập mã giảm giá (kiểm tra `/api/ma-giam-gia/kiem-tra`) → submit
7. **Backend xử lý đơn** (fire-and-forget):
   - Lưu đơn hàng vào Supabase
   - Increment `da_dung` trên `ma_giam_gia`
   - Decrement tồn kho qua RPC (`decrement_so_luong` hoặc `decrement_size_so_luong`)
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
| `/api/nhan-vien` | GET, POST | **Admin only** | `nhan_vien` |
| `/api/nhan-vien/[id]` | PUT, DELETE | **Admin only** | `nhan_vien` |
| `/api/thong-ke` | GET | `dashboard` access | `don_hang`, `san_pham`, `luot_truy_cap`, `danh_muc` |
| `/api/tracking` | POST | None (public) | `luot_truy_cap` |
| `/api/upload` | POST | `san-pham` access | Supabase Storage |
| `/api/generate-mo-ta` | POST | `san-pham` access | None |
| `/api/telegram` | POST | None (webhook) | None |

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
// Handler chỉ setState, không gọi loadData trực tiếp
// refreshKey++ để trigger reload sau delete/save
```

### Error handling
- Tất cả API route: try/catch, trả về `{ success: boolean, data?, error? }`
- Client: dùng `useToast()` → `showToast(message, 'error'|'success')` thay vì `alert()`
- Google Sheets + Telegram: fire-and-forget, không block response
- Tracking: luôn trả 200, không block

### Security
- Middleware bảo vệ `/admin/*` bằng cookie `admin-auth` OR `staff-token`
- Routes POST/PUT/DELETE trong admin verify header `x-admin-password` hoặc staff token
- Đăng nhập dùng `window.location.replace()` (hard navigation để middleware nhận cookie mới)
- Không expose API keys ra client component
- Staff token: HMAC-SHA256 (Web Crypto), PBKDF2 password hashing, 24h expiry

### Notifications
- `useToast()` — hook từ `ToastContext`, available trong toàn bộ admin (ToastProvider trong AdminNav)
- `useOrderNotifications()` — hook Supabase Realtime + polling 60s, dùng trong AdminNav

---

## Chức năng chính

### Shop (khách hàng)
- **Hero**: Fullscreen banner với framer-motion text animations ("Nhẹ Nhàng. Thanh Lịch. Tự Do.")
- **ProductGrid**: Tìm kiếm, filter danh mục, server-side pagination, chỉ hiện `con_hang=true`
- **ProductCard**: Ảnh portrait 3:4, badge giảm giá, low-stock indicator, quick-add on hover
- **Product Detail**: Sticky image, size selector (out-of-stock gạch chéo), qty control, "Thêm giỏ" + "Mua ngay"
- **Giỏ hàng**: CartItem với image, size, qty control, remove, order summary
- **Checkout**: Floating label form, coupon validation (real-time), order summary, fire-and-forget order placement
- **Fly-to-cart**: Parabolic animation từ vị trí click → giỏ hàng (framer-motion + flash effect)
- **Tracking**: Ghi lượt truy cập mỗi page (fire-and-forget, skip /admin & /api)

### Admin
- **Dashboard**:
  - 4 KPI lớn: Doanh thu tháng, Đơn hôm nay, Lượt truy cập hôm nay, Sản phẩm đang bán
  - 8 stat nhỏ: Doanh thu hôm nay/tháng trước/tăng trưởng/tổng, Đơn đang xử lý/mới/đã giao/huỷ
  - 2 BarChart (recharts): Lượt truy cập 7 ngày + Đơn hàng 7 ngày
  - Top sản phẩm bán chạy + Top danh mục bán chạy
  - Tổng quan kho hàng (progress bars)
  - Auto-refresh mỗi 60s

- **Sản phẩm**: CRUD, upload ảnh, quick-pick sizes (XS-XXL, 36-42), generate mô tả AI, filter (search, DM, tồn kho, con_hang), server-side pagination, StockBadge (4 levels)
- **Đơn hàng**: Filter đa chiều (status, tên, SĐT, date range), bulk select + bulk status change, export Excel từ template (auto chuyển "Đã lên đơn"), OrderDetailModal
- **Khách hàng**: CRM tự động từ đơn hàng, filter trạng thái, modal chi tiết (edit trạng thái/ghi chú, lịch sử đơn)
- **Mã giảm giá**: CRUD, toggle on/off, generate code ngẫu nhiên, kiểm tra hết hạn/hết lượt, loại % hoặc số tiền
- **Nhân viên**: CRUD, phân quyền (checkbox ALL_QUYEN), password hash (bcrypt), active/inactive toggle
- **Cài đặt**: Logo upload, thông tin shop (tên, SĐT, địa chỉ, email), quản lý trạng thái KH tùy chỉnh (tên + màu)
- **Bell notification**: Supabase Realtime INSERT + polling 60s, badge đếm đơn mới chưa đọc, dropdown chi tiết, click → OrderDetailModal

---

## Lưu ý quan trọng

1. **Supabase Storage**: buckets phải set public policy để ảnh hiển thị không cần auth
2. **GOOGLE_PRIVATE_KEY**: Khi paste vào Vercel env giữ nguyên `\n`
3. **Google Sheets** chỉ là sao lưu — không dùng làm database chính
4. **giaHienThi** tính và lưu vào CartItem tại thời điểm add-to-cart, không tính lại khi đặt
5. **Admin auth**: Cookie httpOnly 24h + localStorage cho header `x-admin-password`
6. **stone color scale** đã được customize — không dùng Tailwind mặc định
7. **Hero image**: `/public/hero.jpg` — ảnh tĩnh local
8. **Sizes**: JSONB `[{ten, so_luong}]` — empty array nếu không quản lý theo size, total so_luong = sum của sizes
9. **Excel export**: Dùng template `template/ExcelTemplateVi.xlsx`, copy formatting từ header row
10. **AI models**: `stepfun/step-3.5-flash:free` (generateMoTa) và `qwen/qwen3.6-plus:free` (ai.ts)
11. **Staff token**: HMAC-SHA256 với Web Crypto, PBKDF2 hashing — hoạt động trên Edge runtime
12. **predev/prebuild**: Tự động xóa `.next` folder trước khi dev/build

---

## Dependencies

### Production
| Package | Version | Mục đích |
|---------|---------|----------|
| `next` | 14.2.35 | Framework |
| `react` / `react-dom` | ^18 | UI library |
| `@supabase/supabase-js` | ^2.101.1 | Database client |
| `framer-motion` | ^12.38.0 | Animations (hero, fly-to-cart) |
| `recharts` | ^3.8.1 | Dashboard charts |
| `exceljs` | ^4.4.0 | Excel export |
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
