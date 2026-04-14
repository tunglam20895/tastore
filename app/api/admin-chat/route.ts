import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccess } from '@/lib/auth';
import { streamChatWithAI } from '@/lib/qwen';

export const dynamic = 'force-dynamic';

/** Common types for API response data (avoid `any`) */
type DoanhThuData = Record<string, number | null>;
type DonHangData = Record<string, number>;
type SanPhamData = Record<string, number>;
type KhachHangData = Record<string, number | string>;
type NhanVienData = Record<string, number>;
type TrackingData = Record<string, number>;
type TopKhachHang = { ten: string; tongDoanhThu: number };
type DonTheoNhanVien = { ten: string; soDon: number; doanhThu: number };
type TopBanChay = { ten: string; soLuong: number };
type TopDanhMuc = { ten: string; soLuong: number };
type ThongKeData = {
  doanhThu?: DoanhThuData;
  donHang?: DonHangData;
  khachHang?: KhachHangData & { topKhachHang?: TopKhachHang[]; tongDoanhThu?: number };
  nhanVien?: NhanVienData & { tongLuongChiTra?: number; conHoatDong?: number };
  sanPham?: SanPhamData & { topBanChay?: TopBanChay[]; topDanhMuc?: TopDanhMuc[] };
  tracking?: TrackingData;
  donTheoNhanVien?: DonTheoNhanVien[];
};
type SPItem = { ten: string; giaHienThi: number; phanTramGiam?: number; soLuong: number; conHang: boolean; giaGoc?: number };
type DHItem = { trangThai: string; tenKH: string; sdt: string; tongTien: number; sanPham?: unknown[]; nguoiXuLy: string; thoiGian: string };
type KHItem = { ten: string; sdt: string; tongDon: number; tongDoanhThu: number; trangThai: string; ghiChu?: string; updatedAt: string };
type NVItem = { ten: string; conHoatDong: boolean; luong: number; quyen: string[] };
type DHChiTiet = { id: string; tenKH: string; sdt: string; diaChi: string; trangThai: string; nguoiXuLy: string; tongTien: number; thoiGian: string; sanPham?: Array<{ ten: string; sizeChon?: string; soLuong: number; giaHienThi: number }> };

/** Headers cho gọi internal API routes của dự án */
function apiHeaders() {
  const pw = process.env.ADMIN_PASSWORD || '';
  return { 'Content-Type': 'application/json', 'x-admin-password': pw };
}

/** Gọi internal API route → trả JSON (có log debug) */
async function callInternalAPI(path: string): Promise<Record<string, unknown> | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${path}`;
    console.log(`🔍 [AdminChat] Gọi API: ${fullUrl}`);
    console.log(`🔍 [AdminChat] Headers x-admin-password: ${apiHeaders()['x-admin-password'] ? '***' + apiHeaders()['x-admin-password'].slice(-4) : 'EMPTY'}`);

    const res = await fetch(fullUrl, {
      headers: apiHeaders(),
      cache: 'no-store',
    });

    console.log(`🔍 [AdminChat] Response status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`❌ [AdminChat] API error ${res.status}: ${errText}`);
      return null;
    }

    const json = await res.json();
    console.log(`✅ [AdminChat] API ${path} success. Keys: ${JSON.stringify(Object.keys(json || {}))}`);
    if (json.data) {
      console.log(`✅ [AdminChat] Data type: ${Array.isArray(json.data) ? `Array[${json.data.length}]` : typeof json.data}`);
      if (!Array.isArray(json.data)) {
        console.log(`✅ [AdminChat] Data keys: ${JSON.stringify(Object.keys(json.data))}`);
      }
    }
    return json;
  } catch (err) {
    console.error(`❌ [AdminChat] callInternalAPI error:`, err);
    return null;
  }
}

/**
 * GET /api/admin-chat/context — lấy context từ trang hiện tại
 * GỌI INTERNAL APIs thay vì query Supabase trực tiếp
 */
export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 });
    }

    const page = request.nextUrl.searchParams.get('page') || 'dashboard';
    let contextData = '';

    // Gọi /api/thong-ke cho dashboard
    const statsRes = await callInternalAPI('/api/thong-ke');
    if (statsRes?.success) {
      const d = statsRes.data as ThongKeData;
      const dt = d.doanhThu || {};
      const pt = dt.phanTramTangTruong ?? null;
      contextData = `
=== THỐNG KÊ TỔNG QUAN ===
💰 Doanh thu:
   - Hôm nay: ${formatMoney(dt.homNay || 0)}
   - Tháng này: ${formatMoney(dt.thangNay || 0)}
   - Tháng trước: ${formatMoney(dt.thangTruoc || 0)}
   - Tổng cộng: ${formatMoney(dt.tongCong || 0)}
   - Tăng trưởng: ${pt !== null ? (pt > 0 ? '+' : '') + pt + '%' : 'N/A'}

📦 Đơn hàng (tổng ${d.donHang?.tongCong || 0} đơn):
   - Hôm nay: ${d.donHang?.homNay || 0}
   - Mới: ${d.donHang?.moiChua || 0} | Chốt để lên đơn: ${d.donHang?.choTotLenDon || 0}
   - Đã lên đơn: ${d.donHang?.daLenDon || 0} | Đang xử lý: ${d.donHang?.dangXuLy || 0}
   - Đã giao: ${d.donHang?.daGiao || 0} | Huỷ: ${d.donHang?.huy || 0}

👥 Khách hàng: ${d.khachHang?.tongSo || 0} KH | Tổng DT từ KH: ${formatMoney(Number(d.khachHang?.tongDoanhThu) || 0)}
${d.khachHang?.topKhachHang?.length ? `   Top KH: ${d.khachHang.topKhachHang.map((k) => k.ten + ' (' + formatMoney(k.tongDoanhThu) + ')').join(' | ')}` : ''}

👥 Nhân viên: ${d.nhanVien?.tongSo || 0} NV | Đang hoạt động: ${d.nhanVien?.conHoatDong || 0}
   - Tổng lương chi trả/tháng: ${formatMoney(d.nhanVien?.tongLuongChiTra || 0)}
${d.donTheoNhanVien?.length ? `   - Đơn theo NV: ${d.donTheoNhanVien.map((n) => n.ten + ': ' + n.soDon + ' đơn').join(' | ')}` : ''}

📦 Sản phẩm: Đang bán ${d.sanPham?.dangBan || 0} | Hết hàng ${d.sanPham?.hetHang || 0}
${d.sanPham?.topBanChay?.length ? `   Top SP bán chạy: ${d.sanPham.topBanChay.map((s) => s.ten + ' (' + s.soLuong + ')').join(' | ')}` : ''}
${d.sanPham?.topDanhMuc?.length ? `   Top danh mục: ${d.sanPham.topDanhMuc.map((dm) => dm.ten + ' (' + dm.soLuong + ')').join(' | ')}` : ''}

📈 Lượt truy cập: Hôm nay ${d.tracking?.homNay || 0} | Tháng ${d.tracking?.thangNay || 0} | Tổng ${d.tracking?.tongCong || 0}
`.trim();
    }

    // Bổ sung theo trang
    if (page === 'san-pham') {
      const spRes = await callInternalAPI('/api/san-pham?page=1&limit=20');
      if (spRes?.success) {
        contextData += `\n\n=== SẢN PHẨM (trang ${spRes.page}/${spRes.totalPages}, tổng ${spRes.total} SP) ===\n`;
        contextData += (spRes.data as SPItem[] || []).map((s) =>
          `• "${s.ten}" | Giá ${formatMoney(s.giaHienThi)}${s.phanTramGiam ? ` (GIẢM ${s.phanTramGiam}%)` : ''} | Tồn ${s.soLuong} | ${s.conHang ? '✅ Còn' : '❌ Hết'}`
        ).join('\n');
      }
    }

    if (page === 'don-hang') {
      const dhRes = await callInternalAPI('/api/don-hang?page=1&limit=15');
      if (dhRes?.success) {
        contextData += `\n\n=== ĐƠN HÀNG (trang ${dhRes.page}/${dhRes.totalPages}, tổng ${dhRes.total} đơn) ===\n`;
        contextData += (dhRes.data as DHItem[] || []).map((o) =>
          `[${o.trangThai}] ${o.tenKH} (${o.sdt}) | ${formatMoney(o.tongTien)} | ${(o.sanPham || []).length} SP | NV ${o.nguoiXuLy} | ${new Date(o.thoiGian).toLocaleDateString('vi-VN')}`
        ).join('\n');
      }
    }

    if (page === 'khach-hang') {
      const khRes = await callInternalAPI('/api/khach-hang?page=1&limit=15');
      if (khRes?.success) {
        contextData += `\n\n=== KHÁCH HÀNG (trang ${khRes.page}/${khRes.totalPages}, tổng ${khRes.total} KH) ===\n`;
        contextData += (khRes.data as KHItem[] || []).map((k) =>
          `"${k.ten}" (${k.sdt}) | ${k.tongDon} đơn | ${formatMoney(k.tongDoanhThu)} | ${k.trangThai}${k.ghiChu ? ` | "${k.ghiChu}"` : ''}`
        ).join('\n');
      }
    }

    if (page === 'nhan-vien') {
      const nvRes = await callInternalAPI('/api/nhan-vien');
      if (nvRes?.success) {
        contextData += `\n\n=== NHÂN VIÊN (tổng ${(nvRes.data as NVItem[] || []).length} NV) ===\n`;
        contextData += (nvRes.data as NVItem[] || []).map((n) =>
          `"${n.ten}" | ${n.conHoatDong ? '✅' : '❌'} | Lương ${formatMoney(n.luong || 0)} | Quyền ${(n.quyen || []).join(', ')}`
        ).join('\n');
      }
    }

    return NextResponse.json({ success: true, data: { page, context: contextData } });
  } catch (error) {
    console.error('GET /api/admin-chat/context error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi lấy context' }, { status: 500 });
  }
}

/**
 * Phân tích intent từ câu hỏi → xác định INTERNAL API nào cần gọi
 */
function analyzeIntent(messages: Array<{ role: string; content: string }>) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

  const intent = {
    needsThongKe: false,
    needsDonHang: false,
    needsSanPham: false,
    needsKhachHang: false,
    needsNhanVien: false,
    needsSpecificDonHang: null as string | null,
    needsSpecificKhachHang: null as string | null,
  };

  // Thống kê / Dashboard
  if (/doanh thu|doanh số|thống kê|dashboard|tổng quan|lợi nhuận|bán được|thu nhập|tăng trưởng/.test(lastUserMsg) ||
      /hôm nay|tháng này|tháng trước/.test(lastUserMsg)) {
    intent.needsThongKe = true;
  }

  // Đơn hàng
  if (/đơn hàng|đơn mới|bao nhiêu đơn|số.*đơn|chốt đơn|đang xử lý|đã giao|đơn hôm nay|đơn tháng|tổng đơn/.test(lastUserMsg)) {
    intent.needsDonHang = true;
  }

  // Sản phẩm / Tồn kho — dùng \b để tránh khớp "khách hàng", "đơn hàng"
  if (/sản phẩm|sp\b|bao nhiêu sản phẩm|mấy sản phẩm|tồn kho|hết hàng|còn hàng|nhập hàng|mặt hàng|kho hàng|kho bãi|số.*sản phẩm|top.*sp/.test(lastUserMsg)) {
    intent.needsSanPham = true;
  }

  // Khách hàng
  if (/khách hàng|kh\b|người mua|top kh|khách vip|bao nhiêu khách|tổng khách/.test(lastUserMsg)) {
    intent.needsKhachHang = true;
  }

  // Nhân viên / Lương
  if (/nhân viên|nv\b|nhân sự|lương|tiền lương|chi phí lương|bao nhiêu nhân viên|tổng nhân viên/.test(lastUserMsg)) {
    intent.needsNhanVien = true;
  }

  // Tìm đơn hàng cụ thể theo ID
  const orderIdMatch = lastUserMsg.match(/dh_\w+/i);
  if (orderIdMatch) intent.needsSpecificDonHang = orderIdMatch[0];

  // Tìm khách hàng cụ thể theo SĐT
  const phoneMatch = lastUserMsg.match(/0\d{9,10}/);
  if (phoneMatch) intent.needsSpecificKhachHang = phoneMatch[0];

  return intent;
}

/**
 * Tự động fetch data từ INTERNAL APIs (không query Supabase trực tiếp)
 * Gọi chính các API route đã có → đảm bảo data đúng schema, đúng format
 */
async function fetchFreshData(intent: ReturnType<typeof analyzeIntent>) {
  console.log(`🎯 [AdminChat] Intent analysis:`, JSON.stringify(intent, null, 2));

  const results: string[] = [];
  const promises: Promise<void>[] = [];

  // 📊 Thống kê → gọi /api/thong-ke
  if (intent.needsThongKe) {
    console.log(`📊 [AdminChat] Gọi /api/thong-ke cho intent needsThongKe`);
    promises.push((async () => {
      const res = await callInternalAPI('/api/thong-ke');
      console.log(`📊 [AdminChat] /api/thong-ke response:`, res ? `success=${res.success}` : 'null');
      if (res?.success) {
        const d = res.data as ThongKeData;
        console.log(`📊 [AdminChat] Thong ke data doanhThu:`, JSON.stringify(d.doanhThu));
        const dt = d.doanhThu || {};
        const pt = dt.phanTramTangTruong ?? null;
        results.push(`[THONG_KE]
[DOANH_THU]
  hom_nay: ${formatMoney(dt.homNay || 0)}
  thang_nay: ${formatMoney(dt.thangNay || 0)}
  thang_truoc: ${formatMoney(dt.thangTruoc || 0)}
  tong_tat_ca: ${formatMoney(dt.tongCong || 0)}
  tang_truong: ${pt !== null ? (pt > 0 ? '+' : '') + pt + '%' : 'N/A'}
[/DOANH_THU]
[DON_HANG]
  tong: ${d.donHang?.tongCong || 0}
  hom_nay: ${d.donHang?.homNay || 0}
  moi: ${d.donHang?.moiChua || 0}
  chot_de_len: ${d.donHang?.choTotLenDon || 0}
  da_len: ${d.donHang?.daLenDon || 0}
  dang_xu_ly: ${d.donHang?.dangXuLy || 0}
  da_giao: ${d.donHang?.daGiao || 0}
  huy: ${d.donHang?.huy || 0}
[/DON_HANG]
[/THONG_KE]`);
      }
    })());
  }

  // 📦 Đơn hàng → gọi /api/don-hang
  if (intent.needsDonHang) {
    console.log(`📦 [AdminChat] Gọi /api/don-hang cho intent needsDonHang`);
    promises.push((async () => {
      const res = await callInternalAPI('/api/don-hang?page=1&limit=20');
      console.log(`📦 [AdminChat] /api/don-hang response:`, res ? `success=${res.success}, total=${res.total}` : 'null');
      if (res?.success) {
        results.push(`📦 ĐƠN HÀNG (từ /api/don-hang):
   • TỔNG: ${res.total || 0} đơn | Trang ${res.page}/${res.totalPages}
${(res.data as DHItem[] || []).map((o) => `   • [${o.trangThai}] ${o.tenKH} (${o.sdt}) | ${formatMoney(o.tongTien)} | ${(o.sanPham || []).length} SP | NV ${o.nguoiXuLy} | ${new Date(o.thoiGian).toLocaleDateString('vi-VN')}`).join('\n')}`);
      }
    })());
  }

  // 📦 Sản phẩm → gọi /api/san-pham
  if (intent.needsSanPham) {
    console.log(`📦 [AdminChat] Gọi /api/san-pham cho intent needsSanPham`);
    promises.push((async () => {
      const res = await callInternalAPI('/api/san-pham?page=1&limit=30');
      console.log(`📦 [AdminChat] /api/san-pham response:`, res ? `success=${res.success}, total=${res.total}` : 'null');
      if (res?.success) {
        const data = res.data as SPItem[] || [];
        const dangBan = data.filter((s) => s.conHang).length;
        const hetHang = data.filter((s) => !s.conHang).length;
        results.push(`📦 SẢN PHẨM (từ /api/san-pham):
   • TỔNG SỐ SẢN PHẨM: ${res.total || 0}
   • Đang bán: ${dangBan} | Hết hàng: ${hetHang}
   • Trang ${res.page}/${res.totalPages} (limit ${res.limit || 20})
${data.slice(0, 15).map((s) => `   • "${s.ten}" | ${formatMoney(s.giaHienThi)}${s.phanTramGiam ? ` (GIẢM ${s.phanTramGiam}%)` : ''} | Tồn ${s.soLuong} | ${s.conHang ? '✅' : '❌'}`).join('\n')}${data.length > 15 ? `\n   ... và ${data.length - 15} SP khác` : ''}`);
      }
    })());
  }

  // 👥 Khách hàng → gọi /api/khach-hang
  if (intent.needsKhachHang) {
    console.log(`👥 [AdminChat] Gọi /api/khach-hang cho intent needsKhachHang`);
    promises.push((async () => {
      const res = await callInternalAPI('/api/khach-hang?page=1&limit=20');
      console.log(`👥 [AdminChat] /api/khach-hang response:`, res ? `success=${res.success}, total=${res.total}` : 'null');
      if (res?.success) {
        results.push(`👥 KHÁCH HÀNG (từ /api/khach-hang):
   • TỔNG: ${res.total || 0} khách hàng | Trang ${res.page}/${res.totalPages}
${(res.data as KHItem[] || []).map((k) => `   • "${k.ten}" (${k.sdt}) | ${k.tongDon} đơn | ${formatMoney(k.tongDoanhThu)} | ${k.trangThai}${k.ghiChu ? ` | "${k.ghiChu}"` : ''}`).join('\n')}`);
      }
    })());
  }

  // 👥 Nhân viên → gọi /api/nhan-vien
  if (intent.needsNhanVien) {
    console.log(`👥 [AdminChat] Gọi /api/nhan-vien cho intent needsNhanVien`);
    promises.push((async () => {
      const res = await callInternalAPI('/api/nhan-vien');
      console.log(`👥 [AdminChat] /api/nhan-vien response:`, res ? `success=${res.success}, count=${Array.isArray(res.data) ? res.data.length : 0}` : 'null');
      if (res?.success) {
        const nvList = Array.isArray(res.data) ? res.data as NVItem[] : [];
        const tongLuong = nvList.reduce((s: number, n) => s + (n.luong || 0), 0);
        results.push(`👥 NHÂN VIÊN (từ /api/nhan-vien):
   • TỔNG: ${nvList.length} NHÂN VIÊN
   • Tổng lương chi trả/tháng: ${formatMoney(tongLuong)}
${nvList.map((n) => `   • "${n.ten}" | ${n.conHoatDong ? '✅ Đang HĐ' : '❌ Nghỉ'} | Lương ${formatMoney(n.luong || 0)} | Quyền ${(n.quyen || []).join(', ')}`).join('\n')}`);
      }
    })());
  }

  // 📋 Đơn hàng cụ thể → gọi /api/don-hang/[id]
  if (intent.needsSpecificDonHang) {
    console.log(`📋 [AdminChat] Gọi /api/don-hang/${intent.needsSpecificDonHang}`);
    promises.push((async () => {
      const res = await callInternalAPI(`/api/don-hang/${intent.needsSpecificDonHang}`);
      console.log(`📋 [AdminChat] /api/don-hang/[id] response:`, res ? `success=${res.success}` : 'null');
      if (res?.success) {
        const o = res.data as DHChiTiet;
        const spDetail = (o.sanPham || []).map((s) => `   - ${s.ten}${s.sizeChon ? ` (Size: ${s.sizeChon})` : ''} x${s.soLuong} = ${formatMoney(s.giaHienThi * s.soLuong)}`).join('\n');
        results.push(`📋 CHI TIẾT ĐƠN HÀNG ${o.id} (từ /api/don-hang/[id]):
   - Khách: ${o.tenKH} (${o.sdt})
   - Địa chỉ: ${o.diaChi}
   - Trạng thái: ${o.trangThai} | Người xử lý: ${o.nguoiXuLy}
   - Sản phẩm:\n${spDetail}
   - Tổng tiền: ${formatMoney(o.tongTien)}
   - Thời gian: ${new Date(o.thoiGian).toLocaleString('vi-VN')}`);
      } else {
        results.push(`🔍 Không tìm thấy đơn hàng ${intent.needsSpecificDonHang}`);
      }
    })());
  }

  // 👤 Khách hàng cụ thể → gọi /api/khach-hang
  if (intent.needsSpecificKhachHang) {
    console.log(`👤 [AdminChat] Gọi /api/khach-hang?search=${intent.needsSpecificKhachHang}`);
    promises.push((async () => {
      const res = await callInternalAPI(`/api/khach-hang?search=${encodeURIComponent(intent.needsSpecificKhachHang!)}&limit=5`);
      const dataLen = Array.isArray(res?.data) ? res.data.length : 0;
      console.log(`👤 [AdminChat] /api/khach-hang search response:`, res ? `success=${res.success}, dataLen=${dataLen}` : 'null');
      if (res?.success && dataLen > 0) {
        const k = (res.data as KHItem[])[0];
        results.push(`👤 KHÁCH HÀNG ${intent.needsSpecificKhachHang} (từ /api/khach-hang):
   - Tên: ${k.ten}
   - Đơn: ${k.tongDon} | Doanh thu: ${formatMoney(k.tongDoanhThu)}
   - Trạng thái: ${k.trangThai}
   - Ghi chú: ${k.ghiChu || '(không có)'}
   - Lần cuối: ${new Date(k.updatedAt).toLocaleDateString('vi-VN')}`);
      } else {
        results.push(`🔍 Không tìm thấy khách hàng với SĐT ${intent.needsSpecificKhachHang}`);
      }
    })());
  }

  await Promise.all(promises);

  const combinedData = results.join('\n\n');
  console.log(`📤 [AdminChat] Fresh data length: ${combinedData.length} chars`);
  console.log(`📤 [AdminChat] Fresh data preview:`, combinedData.substring(0, 500));

  return combinedData;
}

/**
 * POST /api/admin-chat/chat — SSE streaming với auto-fetch từ internal APIs
 */
export async function POST(request: NextRequest) {
  try {
    console.log(`🚀 [AdminChat] POST request received`);
    console.log(`🚀 [AdminChat] NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'}`);
    console.log(`🚀 [AdminChat] ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '***' + process.env.ADMIN_PASSWORD.slice(-4) : 'NOT SET'}`);

    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, context } = body;
    console.log(`🚀 [AdminChat] Messages count: ${messages?.length || 0}`);
    console.log(`🚀 [AdminChat] Last user message: ${messages?.[messages.length - 1]?.content?.substring(0, 100)}`);
    console.log(`🚀 [AdminChat] Context length: ${context?.length || 0}`);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Thiếu tin nhắn' }, { status: 400 });
    }

    // Phân tích intent
    const intent = analyzeIntent(messages);
    console.log(`🎯 [AdminChat] Intent:`, JSON.stringify(intent));

    const needsDataFetch = intent.needsThongKe || intent.needsDonHang || intent.needsSanPham ||
      intent.needsKhachHang || intent.needsNhanVien || intent.needsSpecificDonHang || intent.needsSpecificKhachHang;
    console.log(`🎯 [AdminChat] needsDataFetch: ${needsDataFetch}`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        try {
          if (needsDataFetch) sendEvent('__META__:fetching_data');

          const freshData = needsDataFetch ? await fetchFreshData(intent) : '';
          console.log(`📤 [AdminChat] Final freshData length: ${freshData.length}`);

          // Build context: FRESH DATA first
          let enhancedContext = '';
          if (freshData) {
            enhancedContext += `🚨 DỮ LIỆU MỚI NHẤT TỪ DATABASE 🚨\n${freshData}\n\n`;
          }
          if (context) {
            enhancedContext += `=== DỮ LIỆU MÀN HÌNH ===\n${context}`;
          }

          console.log(`📤 [AdminChat] Enhanced context length: ${enhancedContext.length}`);
          console.log(`📤 [AdminChat] Enhanced context preview:\n${enhancedContext.substring(0, 800)}`);

          const streamGen = streamChatWithAI(messages, enhancedContext);
          let totalChars = 0;
          for await (const chunk of streamGen) {
            sendEvent(chunk);
            totalChars += chunk.length;
          }
          console.log(`✅ [AdminChat] Stream complete. Total chars streamed: ${totalChars}`);
          sendEvent('[DONE]');
          controller.close();
        } catch (error) {
          console.error('❌ [AdminChat] Stream error:', error);
          const errorMsg = error instanceof Error ? error.message : 'Lỗi streaming';
          sendEvent(JSON.stringify({ error: errorMsg }));
          sendEvent('[DONE]');
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('❌ POST /api/admin-chat error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi khi chat AI',
    }, { status: 500 });
  }
}

function formatMoney(amount: number): string {
  // Số nguyên thô + " dong" → AI đọc chính xác, không bị cắt
  // VD: 22289420 dong
  return amount + ' dong';
}
