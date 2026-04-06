# CLAUDE.md - TRANH ANH STORE

## Tổng quan dự án
Website bán hàng cho shop tranh nghệ thuật "TRANH ANH STORE".
Stack: Next.js 14 (App Router) + Google Sheets + Cloudinary + Telegram Bot + Gemini AI.
Deploy: Vercel (free tier).

---

## Cấu trúc thư mục

```
tranh-anh-store/
├── app/
│   ├── (shop)/                  # Layout khách hàng
│   │   ├── page.tsx             # Trang chủ - danh sách sản phẩm
│   │   ├── san-pham/
│   │   │   └── [id]/page.tsx   # Chi tiết sản phẩm
│   │   ├── gio-hang/page.tsx   # Giỏ hàng
│   │   └── dat-hang/page.tsx   # Form đặt hàng
│   ├── admin/                   # Layout admin
│   │   ├── page.tsx             # Login admin
│   │   ├── dashboard/page.tsx   # Tổng quan
│   │   ├── san-pham/page.tsx   # Quản lý sản phẩm
│   │   ├── don-hang/page.tsx   # Quản lý đơn hàng
│   │   └── cai-dat/page.tsx    # Cài đặt shop (logo...)
│   └── api/
│       ├── san-pham/route.ts        # GET, POST sản phẩm
│       ├── san-pham/[id]/route.ts   # PUT, DELETE sản phẩm
│       ├── don-hang/route.ts        # GET, POST đơn hàng
│       ├── don-hang/[id]/route.ts   # PUT trạng thái đơn
│       ├── upload/route.ts          # Upload ảnh Cloudinary
│       ├── gemini/route.ts          # Generate mô tả AI
│       ├── telegram/route.ts        # Webhook Telegram
│       └── cai-dat/route.ts         # GET, PUT cài đặt (logo)
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Logo + nav + giỏ hàng
│   │   └── Footer.tsx          # Thông tin shop
│   ├── shop/
│   │   ├── ProductCard.tsx     # Card sản phẩm
│   │   ├── ProductGrid.tsx     # Lưới sản phẩm
│   │   ├── CartItem.tsx        # Item trong giỏ hàng
│   │   └── OrderForm.tsx       # Form đặt hàng
│   └── admin/
│       ├── ProductForm.tsx     # Form thêm/sửa sản phẩm
│       ├── OrderTable.tsx      # Bảng đơn hàng
│       ├── LogoUpload.tsx      # Upload logo shop
│       └── ImageUpload.tsx     # Upload ảnh sản phẩm
├── lib/
│   ├── google-sheets.ts        # Google Sheets API wrapper
│   ├── cloudinary.ts           # Cloudinary upload helper
│   ├── telegram.ts             # Gửi thông báo Telegram
│   ├── gemini.ts               # Gemini AI generate mô tả
│   └── auth.ts                 # Admin password check
├── types/
│   └── index.ts                # TypeScript types
├── .env.local                  # API keys (không commit)
├── .env.example                # Mẫu env
├── CLAUDE.md                   # File này
└── README.md                   # Hướng dẫn setup
```

---

## Environment Variables

```bash
# Google Sheets
GOOGLE_SHEET_ID=                  # ID của Google Sheet
GOOGLE_SERVICE_ACCOUNT_EMAIL=     # Email service account
GOOGLE_PRIVATE_KEY=               # Private key (giữ nguyên \n)

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Telegram
TELEGRAM_BOT_TOKEN=               # Token từ @BotFather
TELEGRAM_CHAT_ID=                 # Chat ID nhận thông báo

# AI
GEMINI_API_KEY=                   # Google AI Studio

# Admin
ADMIN_PASSWORD=                   # Mật khẩu đăng nhập /admin
```

---

## Google Sheets Structure

### Tab "SanPham"
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| ID | string | Auto generate (sp_timestamp) |
| Ten | string | Tên sản phẩm |
| Gia | number | Giá VNĐ |
| AnhURL | string | URL ảnh trên Cloudinary |
| MoTa | string | Mô tả sản phẩm |
| DanhMuc | string | ID danh mục |
| ConHang | boolean | true/false |

### Tab "DonHang"
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| ID | string | Auto generate (dh_timestamp) |
| TenKH | string | Tên khách hàng |
| SDT | string | Số điện thoại |
| DiaChi | string | Địa chỉ giao hàng |
| SanPham | string | JSON array sản phẩm |
| TongTien | number | Tổng tiền VNĐ |
| ThoiGian | string | ISO timestamp |
| TrangThai | string | Mới / Đang xử lý / Đã giao / Huỷ |

### Tab "DanhMuc"
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| ID | string | danh-muc-slug |
| TenDanhMuc | string | Tên hiển thị |

### Tab "CaiDat"
| Key | Value |
|-----|-------|
| LogoURL | URL logo trên Cloudinary |
| TenShop | TRANH ANH STORE |
| SDT | Số điện thoại shop |
| DiaChi | Địa chỉ shop |
| Email | Email shop |

---

## API Routes

### Sản phẩm
```
GET    /api/san-pham              # Lấy tất cả sản phẩm
POST   /api/san-pham              # Thêm sản phẩm mới (admin)
PUT    /api/san-pham/[id]         # Sửa sản phẩm (admin)
DELETE /api/san-pham/[id]         # Xóa sản phẩm (admin)
```

### Đơn hàng
```
GET    /api/don-hang              # Lấy tất cả đơn (admin)
POST   /api/don-hang              # Tạo đơn hàng mới
PUT    /api/don-hang/[id]         # Cập nhật trạng thái (admin)
```

### Tiện ích
```
POST   /api/upload                # Upload ảnh → Cloudinary
POST   /api/gemini                # Generate mô tả từ AI
POST   /api/telegram              # Webhook nhận lệnh bot
GET    /api/cai-dat               # Lấy cài đặt shop
PUT    /api/cai-dat               # Cập nhật cài đặt (admin)
```

---

## TypeScript Types

```typescript
type SanPham = {
  id: string
  ten: string
  gia: number
  anhURL: string
  moTa: string
  danhMuc: string
  conHang: boolean
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

type CartItem = {
  id: string
  ten: string
  gia: number
  anhURL: string
  soLuong: number
}

type CaiDat = {
  logoURL: string
  tenShop: string
  sdt: string
  diaChi: string
  email: string
}
```

---

## Conventions

### Naming
- Component: PascalCase → `ProductCard.tsx`
- File/folder: kebab-case → `san-pham/`
- Function: camelCase → `getProducts()`
- Type/Interface: PascalCase → `SanPham`, `DonHang`
- Biến: tiếng Anh trong code, tiếng Việt trong UI

### Error Handling
- Tất cả API route phải có try/catch
- Trả về `{ success: boolean, data?, error? }`
- Log lỗi ra console với context rõ ràng

### Security
- Các route POST/PUT/DELETE trong admin phải verify ADMIN_PASSWORD qua header `x-admin-password`
- Không bao giờ expose API keys ra client component
- Tất cả gọi Google Sheets/Cloudinary/Telegram/Gemini chỉ qua API routes

---

## Telegram Notification Format

```
🎨 TRANH ANH STORE - ĐƠN HÀNG MỚI

👤 Tên: {tenKH}
📞 SĐT: {sdt}
📍 Địa chỉ: {diaChi}

🛒 Sản phẩm:
  • {ten} x{soLuong} - {gia}đ
  • ...

💰 Tổng tiền: {tongTien}đ
📝 Ghi chú: {ghiChu}
🕐 Thời gian: {thoiGian}
```

---

## Lưu ý quan trọng

1. **Google Sheets API quota**: 300 req/phút → cache response phía client nếu cần
2. **Cloudinary free**: 25GB storage, 25GB bandwidth/tháng → đủ dùng
3. **Vercel free**: Serverless function timeout 10s → Google Sheets call phải nhanh
4. **GOOGLE_PRIVATE_KEY**: Khi paste vào Vercel env phải giữ nguyên ký tự `\n`
5. **Admin auth**: Dùng cookie/session đơn giản, không cần NextAuth vì chỉ 1 admin
6. **Ảnh logo**: Lưu URL vào tab CaiDat trong Sheet, đọc lên mỗi lần load Header
7. **Supabase thay thế**: Nếu sau này cần scale, migrate từ Google Sheets sang Supabase