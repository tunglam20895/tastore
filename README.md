# TRANG ANH STORE

Website bán hàng cho shop tranh nghệ thuật.

**Stack:** Next.js 14 (App Router) + Google Sheets + Cloudinary + Telegram Bot + Gemini AI

---

## Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình .env.local

```bash
cp .env.example .env.local
```

Điền đầy đủ các giá trị trong `.env.local`

### 3. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Google Sheets Setup

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới → Enable **Google Sheets API**
3. Tạo **Service Account** → tạo JSON key → copy `client_email` và `private_key`
4. Tạo Google Sheet mới → **Share** sheet cho email service account (Editor)
5. Tạo 4 tabs: `SanPham`, `DonHang`, `DanhMuc`, `CaiDat`

### Headers cho từng tab:

| Tab | Headers (hàng 1) |
|-----|------------------|
| **SanPham** | ID \| Ten \| Gia \| AnhURL \| MoTa \| DanhMuc \| ConHang |
| **DonHang** | ID \| TenKH \| SDT \| DiaChi \| SanPham \| TongTien \| ThoiGian \| TrangThai |
| **DanhMuc** | ID \| TenDanhMuc |
| **CaiDat** | Key \| Value (dòng 2-6: LogoURL, TenShop, SDT, DiaChi, Email) |

> **Lưu ý:** `GOOGLE_PRIVATE_KEY` trong `.env.local` phải giữ nguyên `\n`, bao quanh bằng quotes:
> ```
> GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
> ```

---

## Telegram Bot Setup

1. Nhắn `/newbot` tới [@BotFather](https://t.me/BotFather)
2. Làm theo hướng dẫn để nhận `BOT_TOKEN`
3. Nhắn tin cho bot của bạn
4. Truy cập `https://api.telegram.org/bot{TOKEN}/getUpdates` → tìm `chat.id`
5. Cấu hình webhook (tự động khi có đơn hàng mới)

---

## Cloudinary Setup

1. Đăng ký tại [cloudinary.com](https://cloudinary.com) (free tier: 25GB storage, 25GB bandwidth/tháng)
2. Vào Dashboard → copy `Cloud Name`, `API Key`, `API Secret`

---

## Gemini AI Setup

1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Tạo API key → copy vào `GEMINI_API_KEY`

---

## Admin Panel

1. Truy cập `/admin`
2. Nhập mật khẩu (từ `ADMIN_PASSWORD` trong `.env.local`)
3. Các chức năng:
   - **Upload/thay logo shop** — lưu Cloudinary, URL ghi vào Google Sheet
   - **Thêm/sửa/xóa sản phẩm** — upload ảnh lên Cloudinary
   - **Tạo mô tả AI** — Gemini tự động viết mô tả từ tên sản phẩm
   - **Xem đơn hàng** — lọc theo trạng thái
   - **Cập nhật trạng thái** — Mới / Đang xử lý / Đã giao / Huỷ
   - **Cài đặt shop** — tên, SĐT, địa chỉ, email, logo

---

## Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import repository
3. Thêm tất cả environment variables trong **Settings → Environment Variables**
4. Deploy

> **Lưu ý:** `GOOGLE_PRIVATE_KEY` paste nguyên string có `\n`, đặt trong quotes trên Vercel.

---

## Cấu trúc thư mục

```
├── app/
│   ├── layout.tsx             # Root layout (Header + Footer)
│   ├── page.tsx               # Trang chủ - danh sách sản phẩm
│   ├── san-pham/[id]/         # Chi tiết sản phẩm
│   ├── gio-hang/              # Giỏ hàng (localStorage)
│   ├── dat-hang/              # Form đặt hàng
│   ├── admin/                 # Admin panel (middleware bảo vệ)
│   │   ├── login/             # Đăng nhập
│   │   ├── dashboard/         # Tổng quan
│   │   ├── san-pham/          # Quản lý sản phẩm
│   │   ├── don-hang/          # Quản lý đơn hàng
│   │   └── cai-dat/           # Cài đặt shop
│   └── api/                   # API routes (serverless)
├── components/
│   ├── layout/                # Header, Footer
│   ├── shop/                  # ProductCard, ProductGrid, CartItem, OrderForm
│   └── admin/                 # ProductForm, OrderTable, LogoUpload, ImageUpload, AdminNav
├── lib/                       # google-sheets, cloudinary, telegram, gemini, auth
├── types/                     # TypeScript types
├── middleware.ts              # Bảo vệ admin routes
├── .env.example               # Mẫu env
└── CLAUDE.md                  # Documentation
```
