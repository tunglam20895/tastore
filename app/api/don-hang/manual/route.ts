import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { appendDonHangToSheet } from '@/lib/google-sheets'
import { sendOrderNotification } from '@/lib/telegram'
import { verifyAccess } from '@/lib/auth'
import { verifyStaffToken } from '@/lib/staff-auth'
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
    nguoiXuLy: (row.nguoi_xu_ly as string) || 'Chưa có',
  }
}

/** Lấy tên người đang đăng nhập (admin hoặc nhân viên) từ request */
async function getNguoiXuLy(request: NextRequest): Promise<string> {
  const pw = request.headers.get('x-admin-password')
  const adminPw = process.env.ADMIN_PASSWORD
  if (pw && adminPw && pw === adminPw) return 'Admin'

  const token = request.cookies.get('staff-token')?.value
  if (token) {
    const session = await verifyStaffToken(token)
    if (session) return session.ten
  }

  return 'Chưa có'
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const nguoiXuLy = await getNguoiXuLy(request)

    // Validate input
    const tenKH = body.tenKH as string | undefined
    const sdt = body.sdt as string | undefined
    const diaChi = body.diaChi as string | undefined
    const sanPham = body.sanPham as Array<{
      id: string; ten: string; giaGoc: number; phanTramGiam: number | null
      giaHienThi: number; anhURL: string; soLuong: number; sizeChon: string | null
    }> | undefined
    const trangThai = body.trangThai as string | undefined

    if (!tenKH?.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập tên khách hàng' }, { status: 400 })
    }
    if (!sdt?.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập số điện thoại' }, { status: 400 })
    }
    if (!sanPham || sanPham.length === 0) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn sản phẩm' }, { status: 400 })
    }

    // Validate each product exists and has enough stock
    for (const item of sanPham) {
      const { data: sp } = await supabase
        .from('san_pham')
        .select('id, ten, con_hang, so_luong, sizes')
        .eq('id', item.id)
        .single()
      if (!sp) {
        return NextResponse.json({ success: false, error: `Sản phẩm "${item.ten}" không tồn tại` }, { status: 400 })
      }
      if (item.sizeChon) {
        const sizes = (sp.sizes as { ten: string; so_luong: number }[] | null) || []
        const size = sizes.find((s) => s.ten === item.sizeChon)
        if (!size || size.so_luong < item.soLuong) {
          return NextResponse.json({ success: false, error: `Size "${item.sizeChon}" của "${item.ten}" không đủ số lượng` }, { status: 400 })
        }
      } else if (!sp.con_hang || Number(sp.so_luong) < item.soLuong) {
        return NextResponse.json({ success: false, error: `Sản phẩm "${item.ten}" không đủ số lượng` }, { status: 400 })
      }
    }

    // Calculate totals
    let tamTinh = 0
    for (const item of sanPham) {
      tamTinh += item.giaHienThi * item.soLuong
    }

    let giaTriGiam = 0
    let maGiamGia: string | undefined | null = null

    // Validate and calculate discount if coupon is provided
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
        tamTinh >= Number(maData.don_hang_toi_thieu)
      ) {
        if (maData.loai === 'phan_tram') {
          giaTriGiam = Math.round(tamTinh * Number(maData.gia_tri) / 100)
          if (maData.gia_tri_toi_da) {
            giaTriGiam = Math.min(giaTriGiam, Number(maData.gia_tri_toi_da))
          }
        } else {
          giaTriGiam = Math.min(Number(maData.gia_tri), tamTinh)
        }
        maGiamGia = maMaUppercase
      }
    }

    const tongTienSauGiam = Math.max(0, tamTinh - giaTriGiam)

    // Determine initial status (default: "Mới")
    const finalTrangThai = trangThai || 'Mới'

    // Insert order
    const { data, error } = await supabase
      .from('don_hang')
      .insert({
        ten_kh: tenKH.trim(),
        sdt: sdt.trim(),
        dia_chi: (diaChi || '').trim(),
        san_pham: sanPham,
        tong_tien: tongTienSauGiam,
        ma_giam_gia: maGiamGia || null,
        gia_tri_giam: giaTriGiam,
        trang_thai: finalTrangThai,
        nguoi_xu_ly: nguoiXuLy,
      })
      .select()
      .single()

    if (error) throw error
    const donHang = mapRow(data)

    // Increment coupon usage (fire-and-forget)
    if (maGiamGia) {
      const capturedMa = maGiamGia;
      (async () => {
        try {
          const { data: mgg } = await supabase
            .from('ma_giam_gia')
            .select('da_dung')
            .eq('ma', capturedMa)
            .single()
          if (mgg) {
            await supabase
              .from('ma_giam_gia')
              .update({ da_dung: Number(mgg.da_dung) + 1 })
              .eq('ma', capturedMa)
          }
        } catch { /* fire-and-forget */ }
      })()
    }

    // Decrement stock (fire-and-forget)
    for (const item of sanPham) {
      (async () => {
        try {
          if (item.sizeChon) {
            await supabase.rpc('decrement_size_so_luong', {
              p_product_id: item.id,
              p_size_name: item.sizeChon,
              p_quantity: item.soLuong,
            })
          } else {
            await supabase.rpc('decrement_so_luong', {
              product_id: item.id,
              quantity: item.soLuong,
            })
          }
        } catch { /* fire-and-forget */ }
      })()
    }

    // Upsert khach_hang (fire-and-forget)
    ;(async () => {
      try {
        await supabase.rpc('upsert_khach_hang', {
          p_sdt: sdt.trim(),
          p_ten: tenKH.trim(),
          p_doanh_thu: tongTienSauGiam,
        })
      } catch { /* fire-and-forget */ }
    })()

    // fire-and-forget sheets + telegram
    Promise.allSettled([
      appendDonHangToSheet(donHang),
      sendOrderNotification(donHang),
    ]).catch(() => {})

    return NextResponse.json({ success: true, data: donHang })
  } catch (error: unknown) {
    console.error('POST /api/don-hang/manual error:', error)
    return NextResponse.json({ success: false, error: 'Không thể tạo đơn hàng' }, { status: 500 })
  }
}
