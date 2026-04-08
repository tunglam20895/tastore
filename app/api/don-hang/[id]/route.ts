import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import type { DonHang } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('don_hang')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 })

    const order: DonHang = {
      id: data.id,
      tenKH: data.ten_kh,
      sdt: data.sdt,
      diaChi: data.dia_chi,
      sanPham: data.san_pham,
      tongTien: Number(data.tong_tien),
      thoiGian: data.thoi_gian,
      trangThai: data.trang_thai,
      maGiamGia: data.ma_giam_gia ?? undefined,
      giaTriGiam: Number(data.gia_tri_giam ?? 0),
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('GET /api/don-hang/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy đơn hàng' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const trangThai = body.trangThai as DonHang['trangThai']
    if (!trangThai) {
      return NextResponse.json({ success: false, error: 'Thiếu trạng thái' }, { status: 400 })
    }

    const { error } = await supabase
      .from('don_hang')
      .update({ trang_thai: trangThai })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/don-hang/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật đơn hàng' }, { status: 500 })
  }
}
