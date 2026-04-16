import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import type { KhachHang, CartItem } from '@/types'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export const dynamic = "force-dynamic"

function mapKhachHang(row: Record<string, unknown>): KhachHang {
  return {
    sdt: row.sdt as string,
    ten: row.ten as string,
    tongDon: Number(row.tong_don),
    tongDoanhThu: Number(row.tong_doanh_thu),
    trangThai: row.trang_thai as string,
    ghiChu: (row.ghi_chu as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sdt: string } }
) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const sdt = decodeURIComponent(params.sdt)

    // 1. Lấy thông tin khách hàng
    const { data: khData, error: khError } = await supabase
      .from('khach_hang')
      .select('*')
      .eq('sdt', sdt)
      .single()

    if (khError) throw khError
    if (!khData) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404, headers: CORS_HEADERS })
    }

    // 2. Lấy danh sách đơn hàng của khách
    const { data: donHangData } = await supabase
      .from('don_hang')
      .select('*')
      .eq('sdt', sdt)
      .order('thoi_gian', { ascending: false })

    // Enrich đơn hàng với ảnh sản phẩm
    const donHangs = (donHangData || []).map(dh => {
      const sanPham = (dh.san_pham as CartItem[]) || []
      return {
        id: dh.id,
        tenKH: dh.ten_kh,
        sdt: dh.sdt,
        diaChi: dh.dia_chi,
        sanPham,
        tongTien: Number(dh.tong_tien),
        thoiGian: dh.thoi_gian,
        trangThai: dh.trang_thai,
        maGiamGia: dh.ma_giam_gia ?? undefined,
        giaTriGiam: Number(dh.gia_tri_giam ?? 0),
        nguoiXuLy: dh.nguoi_xu_ly || 'Chưa có',
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        khachHang: mapKhachHang(khData),
        donHangs,
      },
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('GET /api/khach-hang/[sdt] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy thông tin khách hàng' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sdt: string } }
) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const sdt = decodeURIComponent(params.sdt)
    const { error } = await supabase
      .from('khach_hang')
      .delete()
      .eq('sdt', sdt)

    if (error) throw error
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('DELETE /api/khach-hang/[sdt] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa khách hàng' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sdt: string } }
) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.trangThai !== undefined) updateData.trang_thai = body.trangThai
    if (body.ghiChu !== undefined) updateData.ghi_chu = body.ghiChu

    const { data, error } = await supabase
      .from('khach_hang')
      .update(updateData)
      .eq('sdt', params.sdt)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('PUT /api/khach-hang/[sdt] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật khách hàng' }, { status: 500, headers: CORS_HEADERS })
  }
}
