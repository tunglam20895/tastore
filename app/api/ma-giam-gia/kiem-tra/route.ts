import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function POST(request: NextRequest) {
  try {
    const { ma, tongTien } = await request.json()

    if (!ma || typeof tongTien !== 'number') {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400, headers: CORS_HEADERS })
    }

    const { data, error } = await supabase
      .from('ma_giam_gia')
      .select('*')
      .eq('ma', (ma as string).toUpperCase().trim())
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Mã giảm giá không tồn tại' }, { headers: CORS_HEADERS })
    }

    // Kiểm tra hiệu lực
    if (!data.con_hieu_luc) {
      return NextResponse.json({ success: false, error: 'Mã đã bị vô hiệu hóa' }, { headers: CORS_HEADERS })
    }

    // Kiểm tra hết lượt
    if (data.da_dung >= data.so_luong) {
      return NextResponse.json({ success: false, error: 'Mã đã hết lượt sử dụng' }, { headers: CORS_HEADERS })
    }

    // Kiểm tra hết hạn
    if (data.ngay_het_han && new Date(data.ngay_het_han) < new Date()) {
      return NextResponse.json({ success: false, error: 'Mã đã hết hạn sử dụng' }, { headers: CORS_HEADERS })
    }

    // Kiểm tra đơn tối thiểu
    if (tongTien < Number(data.don_hang_toi_thieu)) {
      return NextResponse.json({
        success: false,
        error: `Đơn hàng tối thiểu ${Number(data.don_hang_toi_thieu).toLocaleString('vi-VN')}đ để dùng mã này`,
      }, { headers: CORS_HEADERS })
    }

    // Tính giá trị giảm
    let giaTriGiam = 0
    if (data.loai === 'phan_tram') {
      giaTriGiam = Math.round(tongTien * Number(data.gia_tri) / 100)
      if (data.gia_tri_toi_da) {
        giaTriGiam = Math.min(giaTriGiam, Number(data.gia_tri_toi_da))
      }
    } else {
      giaTriGiam = Math.min(Number(data.gia_tri), tongTien)
    }

    return NextResponse.json({
      success: true,
      data: {
        giaTriGiam,
        maInfo: {
          id: data.id,
          ma: data.ma,
          loai: data.loai,
          giaTri: Number(data.gia_tri),
          giaTriToiDa: data.gia_tri_toi_da != null ? Number(data.gia_tri_toi_da) : null,
          donHangToiThieu: Number(data.don_hang_toi_thieu),
          soLuong: Number(data.so_luong),
          daDung: Number(data.da_dung),
          conHieuLuc: data.con_hieu_luc,
          ngayHetHan: data.ngay_het_han,
          createdAt: data.created_at,
        },
      },
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('POST /api/ma-giam-gia/kiem-tra error:', error)
    return NextResponse.json({ success: false, error: 'Không thể kiểm tra mã giảm giá' }, { status: 500, headers: CORS_HEADERS })
  }
}
