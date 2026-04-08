# CLAUDE.md - TRANH ANH STORE

## Tổng quan dự án
Website bán hàng thời trang nữ cao cấp "TRANH ANH STORE".
Stack: Next.js 14 (App Router) + **Supabase PostgreSQL** + **Supabase Storage** + Google Sheets (append-only) + Telegram Bot + OpenRouter AI (`qwen/qwen3-6b:free`).
Deploy: Vercel (free tier).

---

## Cấu trúc thư mục

```
tranh-anh-store/
├── app/
│   ├── page.tsx                        # Trang chủ — HeroSection + ProductGrid
│   ├── layout.tsx                      # Root layout — SettingsContext + TrackingPixel
│   ├── globals.css                     # CSS variables + Tailwind layers
│   ├── san-pham/[id]/page.tsx          # Chi tiết sản phẩm
│   ├── gio-hang/page.tsx               # Giỏ hàng
│   ├── dat-hang/page.tsx               # Form đặt hàng
│   ├── admin/
│   │   ├── layout.tsx                  # Bọc AdminNav
│   │   ├── login/page.tsx              # Đăng nhập (dùng window.location.replace)
│   │   ├── dashboard/page.tsx          # Thống kê tổng quan + biểu đồ 7 ngày
│   │   ├── san-pham/page.tsx           # Quản lý sản phẩm (server-side pagination)
│   │   ├── don-hang/page.tsx           # Quản lý đơn hàng (server-side pagination)
│   │   ├── khach-hang/page.tsx         # Quản lý khách hàng + lịch sử đơn
│   │   ├── ma-giam-gia/page.tsx        # Quản lý mã giảm giá
│   │   └── cai-dat/page.tsx            # Cài đặt shop + quản lý trạng thái KH
│   └── api/
│       ├── san-pham/route.ts           # GET (pagination + filter), POST
│       ├── san-pham/[id]/route.ts      # GET, PUT, DELETE
│       ├── don-hang/route.ts           # GET (pagination + filter), POST
│       ├── don-hang/[id]/route.ts      # GET (chi tiết), PUT (trạng thái)
│       ├── danh-muc/route.ts           # GET, POST
│       ├── khach-hang/route.ts         # GET (pagination + search)
│       ├── khach-hang/[sdt]/route.ts   # PUT (trạng thái + ghi chú)
│       ├── ma-giam-gia/route.ts        # GET (pagination), POST
│       ├── ma-giam-gia/[id]/route.ts   # PUT (toggle), DELETE
│       ├── ma-giam-gia/kiem-tra/route.ts # POST kiểm tra mã hợp lệ
│       ├── trang-thai-kh/route.ts      # GET danh sách trạng thái KH
│       ├── trang-thai-kh/[id]/route.ts # DELETE trạng thái KH
│       ├── thong-ke/route.ts           # GET dashboard stats (doanh thu, đơn, tracking)
│       ├── tracking/route.ts           # POST ghi lượt truy cập (fire-and-forget)
│       ├── upload/route.ts             # POST upload ảnh → Supabase Storage
│       ├── generate-mo-ta/route.ts     # POST generate mô tả AI (OpenRouter)
│       ├── gemini/route.ts             # POST AI route dự phòng (Gemini)
│       ├── cai-dat/route.ts            # GET, PUT cài đặt shop
│       ├── authenticate/route.ts       # POST login admin (set cookie)
│       ├── logout/route.ts             # POST logout (clear cookie)
│       └── telegram/route.ts           # POST webhook Telegram
├── components/
│   ├── TrackingPixel.tsx               # Client component ghi lượt xem mỗi page
│   ├── layout/
│   │   ├── Header.tsx                  # Tên shop căn giữa + nav + giỏ hàng (sticky)
│   │   └── Footer.tsx                  # bg espresso, text cream
│   ├── shop/
│   │   ├── HeroSection.tsx             # Banner fullscreen + framer-motion
│   │   ├── ProductCard.tsx             # Card portrait 3:4, badge discount
│   │   ├── ProductGrid.tsx             # Lưới + filter danh mục + PaginationShop
│   │   ├── PaginationShop.tsx          # Phân trang phía shop
│   │   ├── CartItem.tsx                # Item trong giỏ hàng
│   │   └── OrderForm.tsx               # Form đặt hàng + kiểm tra mã giảm giá
│   └── admin/
│       ├── AdminNav.tsx                # Header admin: nav + bell notification + ToastProvider
│       ├── ProductForm.tsx             # Form thêm/sửa sản phẩm
│       ├── OrderTable.tsx              # Bảng đơn hàng + inline status update
│       ├── OrderDetailModal.tsx        # Popup chi tiết đơn + cập nhật trạng thái
│       ├── Pagination.tsx              # Phân trang dùng chung trong admin
│       ├── LogoUpload.tsx              # Upload logo → Supabase shop-assets
│       └── ImageUpload.tsx             # Upload ảnh → Supabase san-pham-images
├── contexts/
│   ├── SettingsContext.tsx             # Global shop settings (tenShop, logoURL...)
│   └── ToastContext.tsx                # Global toast notifications (thay thế alert())
├── hooks/
│   └── useOrderNotifications.ts       # Bell icon: Supabase Realtime + polling 60s
├── lib/
│   ├── supabase.ts                     # Server client (service role key)
│   ├── supabase-client.ts              # Browser client (anon key) — dùng cho Realtime
│   ├── google-sheets.ts               # CHỈ appendDonHangToSheet() — fire-and-forget
│   ├── telegram.ts                     # Gửi thông báo Telegram khi có đơn mới
│   ├── openrouter.ts                  # OpenRouter AI generate mô tả sản phẩm
│   ├── ai.ts                          # AI helper tổng hợp
│   ├── gemini.ts                      # Gemini AI (dự phòng)
│   ├── cloudinary.ts                  # Cloudinary (legacy, không dùng chính)
│   └── auth.ts                        # Admin password check
├── public/
│   └── hero.jpg                       # Ảnh banner trang chủ
├── supabase/migrations/001_init.sql   # Schema Supabase
├── types/index.ts                     # TypeScript types
├── middleware.ts                      # Bảo vệ /admin/* bằng cookie admin-auth
└── tailwind.config.ts                 # Design tokens (màu sắc custom)
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Sheets (chỉ append đơn hàng mới, không dùng làm DB chính)
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# OpenRouter AI
OPENROUTER_API_KEY=
NEXT_PUBLIC_SITE_URL=

# Admin
ADMIN_PASSWORD=
```

---

## Supabase Schema

### Bảng `san_pham`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | text PK | Auto: sp_{epoch} |
| ten | text | Tên sản phẩm |
| gia_goc | numeric | Giá gốc VNĐ |
| phan_tram_giam | numeric (0-100) | % giảm giá (nullable) |
| anh_url | text | URL ảnh Supabase Storage |
| mo_ta | text | Mô tả sản phẩm |
| danh_muc | text FK | ID danh mục |
| con_hang | boolean | true/false |
| so_luong | numeric | Tổng tồn kho |
| sizes | jsonb | Array SizeItem [{ten, soLuong}] |
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
| trang_thai | text | Mới / Đang xử lý / Đã giao / Huỷ |

### Bảng `danh_muc`
| id | text PK |
| ten_danh_muc | text |

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
| id | uuid PK |
| ten | text | Tên trạng thái (VD: Thân thiết, VIP...) |
| mau | text | Mã màu hex |

### Bảng `ma_giam_gia`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid PK | |
| ma | text UNIQUE | Mã code (uppercase) |
| loai | text | phan_tram / so_tien |
| gia_tri | numeric | Giá trị giảm |
| gia_tri_toi_da | numeric | Giảm tối đa (cho loại %) |
| don_hang_toi_thieu | numeric | Đơn tối thiểu áp dụng |
| so_luong | numeric | Giới hạn số lần dùng |
| da_dung | numeric | Đã dùng |
| con_hieu_luc | boolean | |
| ngay_het_han | date | Nullable |
| created_at | timestamptz | Auto |

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
  conHang: boolean; soLuong: number; sizes: SizeItem[]
}

type CartItem = {
  id: string; ten: string; giaGoc: number
  phanTramGiam: number | null; giaHienThi: number
  anhURL: string; soLuong: number; sizeChon: string | null
}

type DonHang = {
  id: string; tenKH: string; sdt: string; diaChi: string
  sanPham: CartItem[]; tongTien: number; thoiGian: string
  trangThai: 'Mới' | 'Đang xử lý' | 'Đã giao' | 'Huỷ'
  maGiamGia?: string; giaTriGiam: number
}

type KhachHang = {
  sdt: string; ten: string; tongDon: number
  tongDoanhThu: number; trangThai: string
  ghiChu?: string; createdAt: string; updatedAt: string
}

type MaGiamGia = {
  id: string; ma: string; loai: 'phan_tram' | 'so_tien'
  giaTri: number; giaTriToiDa: number | null
  donHangToiThieu: number; soLuong: number; daDung: number
  conHieuLuc: boolean; ngayHetHan: string | null; createdAt: string
}
```

---

## Design System — Feminine Luxury Minimalism

```css
--color-cream:    #EDE8DF   /* nền chính */
--color-blush:    #C8A991   /* accent, border */
--color-rose:     #A8705F   /* badge discount, accent đỏ */
--color-espresso: #1A0A04   /* text chính, CTA */
--color-stone:    #4a3028   /* text phụ (đã làm tối để tăng contrast) */
```

Tailwind stone scale (custom, tối hơn mặc định để contrast cao trên nền cream):
- `stone-300`: #c4a896 — border, divider
- `stone-400`: #7a5a4e — text phụ, label (contrast 6:1 trên nền trắng)
- `stone-500`: #4a3028 — body text phụ
- `stone-600`: #4a2e24 — label đậm

Font heading: **Cormorant Garamond** (font-light, tracking-widest)
Font body/UI: **DM Sans**

---

## Chức năng chính

### Shop (khách hàng)
- Xem sản phẩm: lưới, filter danh mục, phân trang, badge giảm giá
- Chi tiết sản phẩm: ảnh, mô tả, chọn size, thêm giỏ hàng
- Giỏ hàng: tăng/giảm số lượng, xóa, tổng tiền
- Đặt hàng: form floating label, nhập mã giảm giá, xác nhận
- Tracking: ghi lượt truy cập mỗi page (fire-and-forget)

### Admin
- **Dashboard**: doanh thu hôm nay/tháng/tổng, tỉ lệ tăng trưởng, đơn hàng theo trạng thái, top sản phẩm bán chạy, biểu đồ 7 ngày (lượt truy cập + đơn hàng)
- **Sản phẩm**: CRUD, upload ảnh, quản lý sizes, generate mô tả AI, filter tồn kho/danh mục, server-side pagination
- **Đơn hàng**: xem, cập nhật trạng thái, filter nhiều chiều, tìm kiếm, phân trang server-side
- **Khách hàng**: danh sách tự động từ đơn hàng, trạng thái KH tùy chỉnh, ghi chú, xem lịch sử đơn chi tiết
- **Mã giảm giá**: tạo mã (% hoặc số tiền), giới hạn lượt dùng, ngày hết hạn, đơn tối thiểu, toggle on/off
- **Cài đặt**: tên shop, thông tin liên hệ, upload logo, quản lý loại trạng thái khách hàng
- **Bell notification**: Supabase Realtime + polling 60s, badge đếm đơn mới chưa đọc, popup chi tiết đơn khi click
- **Toast notifications**: thay thế toàn bộ `alert()` — popup góc dưới phải, tự biến mất 4 giây

---

## Luồng hoàn chỉnh

1. Khách truy cập → TrackingPixel ghi `luot_truy_cap` (fire-and-forget)
2. Admin thêm sản phẩm: `giaGoc` + `phanTramGiam` + sizes → Supabase, ảnh → Storage
3. Khách xem → badge "-XX%", giá gạch ngang, chọn size
4. Khách thêm giỏ → `giaHienThi` tại thời điểm đó lưu vào CartItem
5. Khách đặt hàng (tùy chọn nhập mã giảm giá) → Supabase lưu đơn → trừ tồn kho → upsert khach_hang → Google Sheet append (fire-and-forget) → Telegram thông báo (fire-and-forget)
6. Admin thấy bell đỏ → click → popup chi tiết đơn → cập nhật trạng thái ngay trong popup

---

## Conventions

### Naming
- Component: PascalCase → `ProductCard.tsx`
- File/folder: kebab-case → `san-pham/`
- Function: camelCase → `computeGiaHienThi()`
- Type/Interface: PascalCase → `SanPham`, `DonHang`

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
- Client: dùng `useToast()` → `showToast(message)` thay vì `alert()`
- Google Sheets + Telegram: fire-and-forget, không block response
- Tracking: luôn trả 200, không block

### Security
- Routes POST/PUT/DELETE trong admin verify header `x-admin-password`
- Middleware bảo vệ `/admin/*` bằng cookie `admin-auth` (httpOnly, 24h)
- Đăng nhập dùng `window.location.replace("/admin/dashboard")` (hard navigation để middleware nhận cookie)
- Không expose API keys ra client component

### Notifications
- `useToast()` — hook từ `ToastContext`, available trong toàn bộ admin (ToastProvider trong AdminNav)
- `useOrderNotifications()` — hook Supabase Realtime + polling, dùng trong AdminNav

---

## Lưu ý quan trọng

1. **Supabase Storage**: buckets phải set public policy để ảnh hiển thị không cần auth
2. **GOOGLE_PRIVATE_KEY**: Khi paste vào Vercel env giữ nguyên `\n`
3. **Google Sheets** chỉ là sao lưu — không dùng làm database chính
4. **giaHienThi** tính và lưu vào CartItem tại thời điểm add-to-cart, không tính lại khi đặt
5. **Admin auth**: Cookie httpOnly 24h + localStorage cho header `x-admin-password`
6. **stone color scale** đã được làm tối hơn Tailwind mặc định — không dùng `text-stone-*` mặc định trên nền tối (espresso), phải dùng `text-cream/*` hoặc `text-white`
7. **Hero image**: `/public/hero.jpg` — ảnh tĩnh local, không phụ thuộc Unsplash
