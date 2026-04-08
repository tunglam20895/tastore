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

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'dashboard')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const prevMonthStart = startOfPrevMonth(now)
    const prevMonthEnd = endOfPrevMonth(now)

    // 7 ngày qua (tracking chart)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [
      donHangAll,
      donHangToday,
      donHangThang,
      donHangThangTruoc,
      donHangTheoNgay,
      sanPhamDangBan,
      sanPhamHetHang,
      trackingToday,
      trackingThang,
      trackingTotal,
      trackingTheoNgay,
    ] = await Promise.all([
      // Tất cả đơn hàng (để tính tổng + bán chạy + danh mục)
      supabase.from('don_hang').select('tong_tien, trang_thai, san_pham, thoi_gian'),
      // Đơn hôm nay
      supabase.from('don_hang').select('tong_tien, trang_thai')
        .gte('thoi_gian', todayStart).lte('thoi_gian', todayEnd),
      // Đơn tháng này
      supabase.from('don_hang').select('tong_tien, trang_thai')
        .gte('thoi_gian', monthStart),
      // Đơn tháng trước
      supabase.from('don_hang').select('tong_tien, trang_thai')
        .gte('thoi_gian', prevMonthStart).lte('thoi_gian', prevMonthEnd),
      // Đơn hàng 7 ngày (group JS-side)
      supabase.from('don_hang').select('thoi_gian, trang_thai')
        .gte('thoi_gian', sevenDaysAgo.toISOString()),
      // SP đang bán
      supabase.from('san_pham').select('id', { count: 'exact', head: true }).eq('con_hang', true),
      // SP hết hàng
      supabase.from('san_pham').select('id', { count: 'exact', head: true }).eq('con_hang', false),
      // Tracking hôm nay
      supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
        .gte('thoi_gian', todayStart).lte('thoi_gian', todayEnd),
      // Tracking tháng này
      supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true })
        .gte('thoi_gian', monthStart),
      // Tracking tổng
      supabase.from('luot_truy_cap').select('id', { count: 'exact', head: true }),
      // Tracking 7 ngày theo ngày (lấy raw rồi group JS-side)
      supabase.from('luot_truy_cap').select('thoi_gian')
        .gte('thoi_gian', sevenDaysAgo.toISOString()),
    ])

    // --- Doanh thu ---
    const allOrders = donHangAll.data || []
    const notCancelled = allOrders.filter((o) => o.trang_thai !== 'Huỷ')
    const doanhThuTong = notCancelled.reduce((s, o) => s + Number(o.tong_tien), 0)

    const todayOrders = donHangToday.data || []
    const doanhThuHomNay = todayOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0)

    const thangOrders = donHangThang.data || []
    const doanhThuThang = thangOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0)

    const prevOrders = donHangThangTruoc.data || []
    const doanhThuThangTruoc = prevOrders.filter(o => o.trang_thai !== 'Huỷ')
      .reduce((s, o) => s + Number(o.tong_tien), 0)

    const phanTramTangTruong = doanhThuThangTruoc === 0
      ? null
      : Math.round(((doanhThuThang - doanhThuThangTruoc) / doanhThuThangTruoc) * 100)

    // --- Đơn hàng ---
    const donHomNay = todayOrders.length
    const trangThaiCount = (orders: typeof allOrders) => ({
      moiChua: orders.filter(o => o.trang_thai === 'Mới').length,
      dangXuLy: orders.filter(o => o.trang_thai === 'Đang xử lý').length,
      daGiao: orders.filter(o => o.trang_thai === 'Đã giao').length,
      huy: orders.filter(o => o.trang_thai === 'Huỷ').length,
    })
    const ttAll = trangThaiCount(allOrders)
    const tiLeHuy = allOrders.length === 0 ? 0
      : Math.round((ttAll.huy / allOrders.length) * 100)

    // --- Sản phẩm bán chạy (top 5) ---
    const sanPhamCount: Record<string, { ten: string; soLuong: number }> = {}
    for (const order of allOrders) {
      if (order.trang_thai === 'Huỷ') continue
      const items = order.san_pham as Array<{ id: string; ten: string; soLuong: number }> || []
      for (const item of items) {
        const key = item.id
        if (!sanPhamCount[key]) sanPhamCount[key] = { ten: item.ten, soLuong: 0 }
        sanPhamCount[key].soLuong += Number(item.soLuong || 0)
      }
    }
    const topSanPham = Object.values(sanPhamCount)
      .sort((a, b) => b.soLuong - a.soLuong)
      .slice(0, 5)

    // --- Danh mục bán chạy (top 3, group by danh_muc trong san_pham JSONB) ---
    const danhMucCount: Record<string, number> = {}
    for (const order of allOrders) {
      if (order.trang_thai === 'Huỷ') continue
      const items = order.san_pham as Array<{ id: string }> || []
      for (const item of items) {
        // Tên danh mục không có trong đơn hàng, chỉ có id sản phẩm
        // Bỏ qua hoặc dùng id sản phẩm làm group
        const key = item.id?.split('_')[0] || 'unknown'
        danhMucCount[key] = (danhMucCount[key] || 0) + 1
      }
    }

    // Query riêng tên danh mục từ bảng danh_muc
    const { data: danhMucData } = await supabase.from('danh_muc').select('id, ten_danh_muc')
    const { data: spData } = await supabase.from('san_pham').select('id, danh_muc')

    // Map productId → danhMucId → tenDanhMuc
    const spToDm: Record<string, string> = {}
    for (const sp of spData || []) {
      spToDm[sp.id as string] = sp.danh_muc as string
    }
    const dmToTen: Record<string, string> = {}
    for (const dm of danhMucData || []) {
      dmToTen[dm.id as string] = dm.ten_danh_muc as string
    }

    const danhMucSoLuong: Record<string, { ten: string; soLuong: number }> = {}
    for (const order of allOrders) {
      if (order.trang_thai === 'Huỷ') continue
      const items = order.san_pham as Array<{ id: string; soLuong: number }> || []
      for (const item of items) {
        const dmId = spToDm[item.id]
        if (!dmId) continue
        const ten = dmToTen[dmId] || dmId
        if (!danhMucSoLuong[dmId]) danhMucSoLuong[dmId] = { ten, soLuong: 0 }
        danhMucSoLuong[dmId].soLuong += Number(item.soLuong || 0)
      }
    }
    const topDanhMuc = Object.values(danhMucSoLuong)
      .sort((a, b) => b.soLuong - a.soLuong)
      .slice(0, 3)

    // --- Helper group theo ngày ---
    const groupByDay = (rows: { thoi_gian: unknown }[]) => {
      const result: { ngay: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const label = `${d.getDate()}/${d.getMonth() + 1}`
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)
        const count = rows.filter((r) => {
          const t = new Date(r.thoi_gian as string)
          return t >= dayStart && t <= dayEnd
        }).length
        result.push({ ngay: label, count })
      }
      return result
    }

    // --- Tracking 7 ngày ---
    const trackingRows = trackingTheoNgay.data || []
    const chartData = groupByDay(trackingRows).map(r => ({ ngay: r.ngay, luot: r.count }))

    // --- Đơn hàng 7 ngày ---
    const donHangRows = (donHangTheoNgay.data || []).filter(o => o.trang_thai !== 'Huỷ')
    const donHangChartData = groupByDay(donHangRows).map(r => ({ ngay: r.ngay, don: r.count }))

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
          dangXuLy: ttAll.dangXuLy,
          daGiao: ttAll.daGiao,
          huy: ttAll.huy,
          tiLeHuy,
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
      },
    })
  } catch (error) {
    console.error('GET /api/thong-ke error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy thống kê' }, { status: 500 })
  }
}
