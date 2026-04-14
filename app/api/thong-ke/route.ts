import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r.toISOString()
}
function endOfDay(d: Date) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r.toISOString()
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}
function startOfPrevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString()
}
function endOfPrevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).toISOString()
}

const MONTH_NAMES = ['Thg1', 'Thg2', 'Thg3', 'Thg4', 'Thg5', 'Thg6', 'Thg7', 'Thg8', 'Thg9', 'Thg10', 'Thg11', 'Thg12'];

function getMonthLabel(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const tuNgay = searchParams.get('tu_ngay') || '';
    const denNgay = searchParams.get('den_ngay') || '';

    // Có filter ngày không?
    const hasDateFilter = tuNgay && denNgay;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfPrevMonth(now);
    const prevMonthEnd = endOfPrevMonth(now);

    // 7 ngày qua (tracking chart)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 7 tháng qua (monthly chart)
    const sevenMonthsAgo = new Date(now);
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);
    sevenMonthsAgo.setDate(1);
    sevenMonthsAgo.setHours(0, 0, 0, 0);

    // ─── Fetch data ───
    let donHangAll, donHangToday, donHangThang, donHangThangTruoc,
        donHangTheoNgay, donHangTheoThang;

    if (hasDateFilter) {
      const filterGte = tuNgay + 'T00:00:00.000Z';
      const filterLte = denNgay + 'T23:59:59.999Z';

      const [allRes, theoNgayRes, theoThangRes] = await Promise.all([
        supabase.from('don_hang').select('tong_tien, trang_thai, san_pham, thoi_gian, nguoi_xu_ly')
          .gte('thoi_gian', filterGte).lte('thoi_gian', filterLte),
        supabase.from('don_hang').select('thoi_gian, trang_thai, nguoi_xu_ly')
          .gte('thoi_gian', filterGte).lte('thoi_gian', filterLte),
        supabase.from('don_hang').select('thoi_gian, trang_thai, nguoi_xu_ly, tong_tien')
          .gte('thoi_gian', filterGte).lte('thoi_gian', filterLte),
      ]);
      donHangAll = { data: allRes.data };
      donHangToday = { data: allRes.data };
      donHangThang = { data: allRes.data };
      donHangThangTruoc = { data: [] };
      donHangTheoNgay = theoNgayRes;
      donHangTheoThang = theoThangRes;
    } else {
      const [allRes, todayRes, thangRes, thangTruocRes, theoNgayRes, theoThangRes] = await Promise.all([
        supabase.from('don_hang').select('tong_tien, trang_thai, san_pham, thoi_gian, nguoi_xu_ly'),
        supabase.from('don_hang').select('tong_tien, trang_thai, nguoi_xu_ly')
          .gte('thoi_gian', todayStart).lte('thoi_gian', todayEnd),
        supabase.from('don_hang').select('tong_tien, trang_thai, nguoi_xu_ly')
          .gte('thoi_gian', monthStart),
        supabase.from('don_hang').select('tong_tien, trang_thai, nguoi_xu_ly')
          .gte('thoi_gian', prevMonthStart).lte('thoi_gian', prevMonthEnd),
        supabase.from('don_hang').select('thoi_gian, trang_thai, nguoi_xu_ly')
          .gte('thoi_gian', sevenDaysAgo.toISOString()),
        supabase.from('don_hang').select('thoi_gian, trang_thai, nguoi_xu_ly, tong_tien')
          .gte('thoi_gian', sevenMonthsAgo.toISOString()),
      ]);
      donHangAll = allRes;
      donHangToday = todayRes;
      donHangThang = thangRes;
      donHangThangTruoc = thangTruocRes;
      donHangTheoNgay = theoNgayRes;
      donHangTheoThang = theoThangRes;
    }

    const [
      sanPhamDangBan,
      sanPhamHetHang,
      trackingToday,
      trackingThang,
      trackingTotal,
      trackingTheoNgay,
      khachHangRes,
      nhanVienRes,
    ] = await Promise.all([
      hasDateFilter
        ? supabase.from('san_pham').select('id', { count: 'exact', head: true })
        : supabase.from('san_pham').select('id', { count: 'exact', head: true }).eq('con_hang', true),
      hasDateFilter
        ? supabase.from('san_pham').select('id', { count: 'exact', head: true })
        : supabase.from('san_pham').select('id', { count: 'exact', head: true }).eq('con_hang', false),
      hasDateFilter
        ? supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
        : supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
          .gte('thoi_gian', todayStart).lte('thoi_gian', todayEnd),
      hasDateFilter
        ? supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
        : supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
          .gte('thoi_gian', monthStart),
      hasDateFilter
        ? supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
        : supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true }),
      hasDateFilter
        ? supabase.from('luot_truy_cap').select('thoi_gian').gte('thoi_gian', sevenDaysAgo.toISOString())
        : supabase.from('luot_truy_cap').select('thoi_gian').gte('thoi_gian', sevenDaysAgo.toISOString()),
      supabase.from('khach_hang').select('sdt, ten, tong_don, tong_doanh_thu'),
      supabase.from('nhan_vien').select('id, ten, luong, con_hoat_dong'),
    ]);

    // --- Doanh thu ---
    const allOrders = donHangAll.data || [];
    const notCancelled = allOrders.filter((o) => o.trang_thai !== 'Huỷ');
    const doanhThuTong = notCancelled.reduce((s, o) => s + Number(o.tong_tien), 0);

    const todayOrders = donHangToday.data || [];
    const doanhThuHomNay = todayOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0);

    const thangOrders = donHangThang.data || [];
    const doanhThuThang = thangOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0);

    const prevOrders = donHangThangTruoc.data || [];
    const doanhThuThangTruoc = prevOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0);

    const phanTramTangTruong = doanhThuThangTruoc === 0
      ? null
      : Math.round(((doanhThuThang - doanhThuThangTruoc) / doanhThuThangTruoc) * 100);

    // --- Đơn hàng ---
    const donHomNay = todayOrders.length;
    const trangThaiCount = (orders: typeof allOrders) => ({
      moiChua: orders.filter(o => o.trang_thai === 'Mới').length,
      choTotLenDon: orders.filter(o => o.trang_thai === 'Chốt để lên đơn').length,
      daLenDon: orders.filter(o => o.trang_thai === 'Đã lên đơn').length,
      dangXuLy: orders.filter(o => o.trang_thai === 'Đang xử lý').length,
      daGiao: orders.filter(o => o.trang_thai === 'Đã giao').length,
      huy: orders.filter(o => o.trang_thai === 'Huỷ').length,
    });
    const ttAll = trangThaiCount(allOrders);
    const tiLeHuy = allOrders.length === 0 ? 0
      : Math.round((ttAll.huy / allOrders.length) * 100);

    // --- Đơn hàng theo nhân viên xử lý ---
    const donTheoNhanVien: Record<string, { ten: string; soDon: number; doanhThu: number }> = {};
    for (const order of notCancelled) {
      const nv = (order.nguoi_xu_ly as string) || 'Chưa có';
      if (!donTheoNhanVien[nv]) donTheoNhanVien[nv] = { ten: nv, soDon: 0, doanhThu: 0 };
      donTheoNhanVien[nv].soDon += 1;
      donTheoNhanVien[nv].doanhThu += Number(order.tong_tien);
    }
    const donTheoNVArr = Object.values(donTheoNhanVien)
      .sort((a, b) => b.soDon - a.soDon);

    // --- Khách hàng ---
    const khachHangData = khachHangRes.data || [];
    const tongKhachHang = khachHangData.length;
    const tongDoanhThuKH = khachHangData.reduce((s, kh) => s + Number(kh.tong_doanh_thu), 0);
    const topKhachHang = [...khachHangData]
      .sort((a, b) => Number(b.tong_doanh_thu) - Number(a.tong_doanh_thu))
      .slice(0, 5)
      .map(kh => ({
        ten: kh.ten,
        sdt: kh.sdt,
        tongDon: Number(kh.tong_don),
        tongDoanhThu: Number(kh.tong_doanh_thu),
      }));

    // --- Nhân viên & Tổng lương ---
    const nhanVienData = nhanVienRes.data || [];
    const tongNhanVien = nhanVienData.length;
    const tongLuongChiTra = nhanVienData.reduce((s, nv) => s + Number(nv.luong ?? 0), 0);
    const nhanVienConHoatDong = nhanVienData.filter(nv => nv.con_hoat_dong).length;

    // --- Sản phẩm bán chạy (top 5) ---
    const sanPhamCount: Record<string, { ten: string; soLuong: number }> = {};
    for (const order of allOrders) {
      if (order.trang_thai === 'Huỷ') continue;
      const items = order.san_pham as Array<{ id: string; ten: string; soLuong: number }> || [];
      for (const item of items) {
        const key = item.id;
        if (!sanPhamCount[key]) sanPhamCount[key] = { ten: item.ten, soLuong: 0 };
        sanPhamCount[key].soLuong += Number(item.soLuong || 0);
      }
    }
    const topSanPham = Object.values(sanPhamCount)
      .sort((a, b) => b.soLuong - a.soLuong)
      .slice(0, 5);

    // --- Danh mục bán chạy (top 3) ---
    const { data: danhMucData } = await supabase.from('danh_muc').select('id, ten_danh_muc');
    const { data: spData } = await supabase.from('san_pham').select('id, danh_muc');

    const spToDm: Record<string, string> = {};
    for (const sp of spData || []) {
      spToDm[sp.id as string] = sp.danh_muc as string;
    }
    const dmToTen: Record<string, string> = {};
    for (const dm of danhMucData || []) {
      dmToTen[dm.id as string] = dm.ten_danh_muc as string;
    }

    const danhMucSoLuong: Record<string, { ten: string; soLuong: number }> = {};
    for (const order of allOrders) {
      if (order.trang_thai === 'Huỷ') continue;
      const items = order.san_pham as Array<{ id: string; soLuong: number }> || [];
      for (const item of items) {
        const dmId = spToDm[item.id];
        if (!dmId) continue;
        const ten = dmToTen[dmId] || dmId;
        if (!danhMucSoLuong[dmId]) danhMucSoLuong[dmId] = { ten, soLuong: 0 };
        danhMucSoLuong[dmId].soLuong += Number(item.soLuong || 0);
      }
    }
    const topDanhMuc = Object.values(danhMucSoLuong)
      .sort((a, b) => b.soLuong - a.soLuong)
      .slice(0, 3);

    // --- Helper group theo ngày ---
    const groupByDay = (rows: { thoi_gian: unknown }[]) => {
      const result: { ngay: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
        const count = rows.filter((r) => {
          const t = new Date(r.thoi_gian as string);
          return t >= dayStart && t <= dayEnd;
        }).length;
        result.push({ ngay: label, count });
      }
      return result;
    };

    // --- Helper group theo tháng (7 tháng gần nhất) ---
    const groupByMonth = (rows: { thoi_gian: unknown; tong_tien?: unknown; trang_thai?: unknown }[]) => {
      const result: { thang: string; doanhThu: number; soDon: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        const label = getMonthLabel(d);
        const monthStartD = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const monthEndD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthOrders = rows.filter((r) => {
          const t = new Date(r.thoi_gian as string);
          return t >= monthStartD && t <= monthEndD;
        });
        const doanhThu = monthOrders
          .filter(o => (o as Record<string, unknown>).trang_thai !== 'Huỷ')
          .reduce((s, o) => s + Number(o.tong_tien || 0), 0);
        result.push({ thang: label, doanhThu, soDon: monthOrders.length });
      }
      return result;
    };

    // --- Tracking 7 ngày ---
    const trackingRows = trackingTheoNgay.data || [];
    const chartData = groupByDay(trackingRows).map(r => ({ ngay: r.ngay, luot: r.count }));

    // --- Đơn hàng 7 ngày ---
    const donHangRows = (donHangTheoNgay.data || []).filter(o => o.trang_thai !== 'Huỷ');
    const donHangChartData = groupByDay(donHangRows).map(r => ({ ngay: r.ngay, don: r.count }));

    // --- Thống kê theo tháng (7 tháng) ---
    const theoThangRows = donHangTheoThang?.data || [];
    const chartTheoThang = groupByMonth(theoThangRows);

    return NextResponse.json({
      success: true,
      data: {
        doanhThu: {
          homNay: doanhThuHomNay,
          thangNay: doanhThuThang,
          thangTruoc: doanhThuThangTruoc,
          tongCong: doanhThuTong,
          phanTramTangTruong,
        },
        donHang: {
          tongCong: allOrders.length,
          homNay: donHomNay,
          moiChua: ttAll.moiChua,
          choTotLenDon: ttAll.choTotLenDon,
          daLenDon: ttAll.daLenDon,
          dangXuLy: ttAll.dangXuLy,
          daGiao: ttAll.daGiao,
          huy: ttAll.huy,
          tiLeHuy,
        },
        donTheoNhanVien: donTheoNVArr,
        khachHang: {
          tongSo: tongKhachHang,
          tongDoanhThu: tongDoanhThuKH,
          topKhachHang,
        },
        nhanVien: {
          tongSo: tongNhanVien,
          conHoatDong: nhanVienConHoatDong,
          tongLuongChiTra,
        },
        sanPham: {
          dangBan: sanPhamDangBan.count ?? 0,
          hetHang: sanPhamHetHang.count ?? 0,
          topBanChay: topSanPham,
          topDanhMuc,
        },
        tracking: {
          homNay: trackingToday.count ?? 0,
          thangNay: trackingThang.count ?? 0,
          tongCong: trackingTotal.count ?? 0,
          chartData,
        },
        donHangChart: donHangChartData,
        chartTheoThang,
      },
    });
  } catch (error) {
    console.error('GET /api/thong-ke error:', error);
    return NextResponse.json({ success: false, error: 'Không thể lấy thống kê' }, { status: 500 });
  }
}
