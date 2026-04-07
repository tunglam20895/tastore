# CLAUDE.md - TRANH ANH STORE

## Tổng quan dự án
Website bán hàng cho shop tranh nghệ thuật "TRANH ANH STORE".
Stack: Next.js 14 (App Router) + **Supabase PostgreSQL** + **Supabase Storage** + Google Sheets (append-only) + Telegram Bot + OpenRouter AI (`qwen/qwen3-6b:free`).
Deploy: Vercel (free tier).

---

## Cấu trúc thư mục

```
tranh-anh-store/
├── app/
│   ├── page.tsx                 # Trang chủ - danh sách sản phẩm
│   ├── san-pham/
│   │   └── [id]/page.tsx       # Chi tiết sản phẩm
│   ├── gio-hang/page.tsx       # Giỏ hàng
│   ├── dat-hang/page.tsx       # Form đặt hàng
│   ├── admin/                   # Layout admin
│   │   ├── login/page.tsx       # Login admin
│   │   ├── dashboard/page.tsx   # Tổng quan
│   │   ├── san-pham/page.tsx   # Quản lý sản phẩm
│   │   ├── don-hang/page.tsx   # Quản lý đơn hàng
│   │   └── cai-dat/page.tsx    # Cài đặt shop (logo...)
│   └── api/
│       ├── san-pham/route.ts        # GET, POST sản phẩm
│       ├── san-pham/[id]/route.ts   # PUT, DELETE sản phẩm
│       ├── don-hang/route.ts        # GET, POST đơn hàng
│       ├── don-hang/[id]/route.ts   # PUT trạng thái đơn
│       ├── danh-muc/route.ts        # GET, POST danh mục
│       ├── upload/route.ts          # Upload ảnh Supabase Storage
│       ├── generate-mo-ta/route.ts  # Generate mô tả AI (OpenRouter)
│       ├── telegram/route.ts        # Webhook Telegram
│       ├── cai-dat/route.ts         # GET, PUT cài đặt (logo)
│       ├── authenticate/route.ts    # Admin login
│       └── logout/route.ts          # Admin logout
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Logo + nav + giỏ hàng (sticky transparent→cream)
│   │   └── Footer.tsx          # bg espresso, text cream
│   ├── shop/
│   │   ├── ProductCard.tsx     # Card portrait 3:4, badge discount, framer-motion
│   │   ├── ProductGrid.tsx     # Lưới + filter danh mục
│   │   ├── CartItem.tsx        # Item trong giỏ hàng (giaHienThi)
│   │   └── OrderForm.tsx       # Form đặt hàng (floating label inputs)
│   └── admin/
│       ├── ProductForm.tsx     # Form thêm/sửa (giaGoc + phanTramGiam + preview)
│       ├── OrderTable.tsx      # Bảng đơn hàng (expandable rows)
│       ├── LogoUpload.tsx      # Upload logo → Supabase shop-assets
│       ├── ImageUpload.tsx     # Upload ảnh → Supabase san-pham-images
│       └── AdminNav.tsx        # Sidebar nav (bg espresso)
├── lib/
│   ├── supabase.ts             # Server client (service role key)
│   ├── supabase-client.ts      # Browser client (anon key)
│   ├── google-sheets.ts        # CHỈ appendDonHangToSheet() — fire-and-forget
│   ├── telegram.ts             # Gửi thông báo Telegram
│   ├── openrouter.ts           # OpenRouter AI generate mô tả
│   └── auth.ts                 # Admin password check
├── supabase/
│   └── migrations/
│       └── 001_init.sql        # Schema Supabase
├── types/
│   └── index.ts                # TypeScript types
└── .env.example                # Mẫu env
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
| created_at | timestamptz | Auto |

### Bảng `don_hang`
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | text PK | Auto: dh_{epoch} |
| ten_kh | text | Tên khách hàng |
| sdt | text | Số điện thoại |
| dia_chi | text | Địa chỉ giao hàng |
| san_pham | jsonb | Array CartItem |
| tong_tien | numeric | Tổng tiền VNĐ |
| thoi_gian | timestamptz | Auto |
| trang_thai | text | Mới / Đang xử lý / Đã giao / Huỷ |

### Bảng `danh_muc`
| id | text PK |
| ten_danh_muc | text |

### Bảng `cai_dat`
| key | text PK | LogoURL, TenShop, SDT, DiaChi, Email |
| value | text | |

### Supabase Storage buckets
- `san-pham-images` — ảnh sản phẩm (public)
- `shop-assets` — logo shop (public)

---

## TypeScript Types

```typescript
type SanPham = {
  id: string
  ten: string
  giaGoc: number
  phanTramGiam: number | null
  giaHienThi: number        // computed: giaGoc * (1 - phanTramGiam/100)
  anhURL: string
  moTa: string
  danhMuc: string
  conHang: boolean
}

type CartItem = {
  id: string
  ten: string
  giaGoc: number
  phanTramGiam: number | null
  giaHienThi: number        // giá tại thời điểm đặt, lưu cố định vào đơn
  anhURL: string
  soLuong: number
}

type DonHang = {
  id: string
  tenKH: string
  sdt: string
  diaChi: string
  sanPham: CartItem[]
  tongTien: number
  thoiGian: string
  trangThai: 'Mới' | 'Đang xử lý' | 'Đã giao' | 'Huỷ'
}
```

---

## Design System — Feminine Luxury Minimalism 2026

```css
--color-cream:    #FAF8F5   /* nền chính */
--color-blush:    #E8D5C4   /* accent nhẹ */
--color-rose:     #C9A99A   /* badge discount, accent */
--color-espresso: #2C1A12   /* text chính, CTA, admin nav */
--color-stone:    #8C7B72   /* text phụ */
```

Font heading: **Cormorant Garamond** (font-light, tracking-widest)
Font body/UI: **DM Sans**

---

## Luồng hoàn chỉnh

1. Admin thêm sản phẩm có `giaGoc` + `phanTramGiam` → lưu Supabase, ảnh lên Supabase Storage
2. Khách xem sản phẩm → thấy badge "-XX%", giá gốc gạch ngang
3. Khách thêm vào giỏ → `giaHienThi` tại thời điểm đó được lưu vào CartItem
4. Khách đặt hàng → Supabase lưu đơn → Google Sheet append row (fire-and-forget) → Telegram gửi thông báo (fire-and-forget)
5. Admin vào dashboard → thấy đơn hàng, cập nhật trạng thái

---

## Conventions

### Naming
- Component: PascalCase → `ProductCard.tsx`
- File/folder: kebab-case → `san-pham/`
- Function: camelCase → `computeGiaHienThi()`
- Type/Interface: PascalCase → `SanPham`, `DonHang`

### Error Handling
- Tất cả API route phải có try/catch
- Trả về `{ success: boolean, data?, error? }`
- Google Sheets và Telegram là fire-and-forget, không block response

### Security
- Routes POST/PUT/DELETE trong admin verify header `x-admin-password`
- Không bao giờ expose API keys ra client component
- Supabase server client dùng service_role key chỉ trong API routes

---

## Lưu ý quan trọng

1. **Supabase Storage**: buckets phải set public policy để ảnh hiển thị không cần auth
2. **GOOGLE_PRIVATE_KEY**: Khi paste vào Vercel env giữ nguyên `\n`
3. **Google Sheets** chỉ là sao lưu — không dùng làm database chính
4. **giaHienThi** phải được tính và lưu vào CartItem tại thời điểm add-to-cart, không tính lại khi đặt hàng
5. **Admin auth**: Cookie httpOnly 24h + localStorage cho header x-admin-password
