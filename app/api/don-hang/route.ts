import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { appendDonHangToSheet } from '@/lib/google-sheets'
import { sendOrderNotification } from '@/lib/telegram'
import { verifyAdminPassword } from '@/lib/auth'
import type { DonHang } from '@/types'

function mapRow(row: Record<string, unknown>): DonHang {
  return {
    id: row.id as string,
    tenKH: row.ten_kh as string,
    sdt: row.sdt as string,
    diaChi: row.dia_chi as string,
    sanPham: row.san_pham as DonHang['sanPham'],
    tongTien: Number(row.tong_tien),
    thoiGian: row.thoi_gian as string,
    trangThai: row.trang_thai as DonHang['trangThai'],
    maGiamGia: row.ma_giam_gia as string | undefined,
    giaTriGiam: Number(row.gia_tri_giam ?? 0),
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('don_hang')
      .select('*')
      .order('thoi_gian', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(mapRow) })
  } catch (error) {
    console.error('GET /api/don-hang error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách đơn hàng' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let giaTriGiam = 0
    let maGiamGia: string | undefined

    // Validate và tính giá trị giảm nếu có mã
    if (body.maGiamGia) {
      const maMaUppercase = (body.maGiamGia as string).toUpperCase().trim()
      const { data: maData } = await supabase
        .from('ma_giam_gia')
        .select('*')
        .eq('ma', maMaUppercase)
        .single()

      if (
        maData &&
        maData.con_hieu_luc &&
        maData.da_dung < maData.so_luong &&
        (!maData.ngay_het_han || new Date(maData.ngay_het_han) >= new Date()) &&
        body.tongTien >= Number(maData.don_hang_toi_thieu)
      ) {
        if (maData.loai === 'phan_tram') {
          giaTriGiam = Math.round(body.tongTien * Number(maData.gia_tri) / 100)
          if (maData.gia_tri_toi_da) {
            giaTriGiam = Math.min(giaTriGiam, Number(maData.gia_tri_toi_da))
          }
        } else {
          giaTriGiam = Math.min(Number(maData.gia_tri), body.tongTien)
        }
        maGiamGia = maMaUppercase
      }
    }

    const tongTienSauGiam = Math.max(0, body.tongTien - giaTriGiam)

    const { data, error } = await supabase
      .from('don_hang')
      .insert({
        ten_kh: body.tenKH,
        sdt: body.sdt,
        dia_chi: body.diaChi,
        san_pham: body.sanPham,
        tong_tien: tongTienSauGiam,
        ma_giam_gia: maGiamGia || null,
        gia_tri_giam: giaTriGiam,
      })
      .select()
      .single()

    if (error) throw error
    const donHang = mapRow(data)

    // Tăng da_dung của mã giảm giá (fire-and-forget)
    if (maGiamGia) {
      const capturedMa = maGiamGia
      supabase
        .from('ma_giam_gia')
        .select('da_dung')
        .eq('ma', capturedMa)
        .single()
        .then(({ data: mgg }) => {
          if (mgg) {
            return supabase
              .from('ma_giam_gia')
              .update({ da_dung: Number(mgg.da_dung) + 1 })
              .eq('ma', capturedMa)
          }
        })
        .catch(() => {})
    }

    // Trừ tồn kho
    for (const item of donHang.sanPham) {
      supabase
        .rpc('decrement_so_luong', { product_id: item.id, quantity: item.soLuong })
        .then(() => {})
        .catch(() => {})
    }

    // fire-and-forget
    Promise.allSettled([
      appendDonHangToSheet(donHang),
      sendOrderNotification(donHang),
    ]).catch(() => {})

    return NextResponse.json({ success: true, data: donHang })
  } catch (error) {
    console.error('POST /api/don-hang error:', error)
    return NextResponse.json({ success: false, error: 'Không thể tạo đơn hàng' }, { status: 500 })
  }
}
