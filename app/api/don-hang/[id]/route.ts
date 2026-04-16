import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { verifyStaffToken } from '@/lib/staff-auth'
import type { DonHang, CartItem } from '@/types'

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

    const sanPham = (data.san_pham as CartItem[]) || []

    // Enrich products with images from san_pham table
    if (sanPham.length > 0) {
      const productIds = sanPham.map(p => p.id).filter(Boolean)
      if (productIds.length > 0) {
        const { data: spData } = await supabase
          .from('san_pham')
          .select('id, anh_url')
          .in('id', productIds)
        if (spData) {
          const imgMap = new Map(spData.map(s => [s.id, s.anh_url]))
          sanPham.forEach(p => { if (!p.anhURL) p.anhURL = imgMap.get(p.id) || '' })
        }
      }
    }

    const order: DonHang = {
      id: data.id,
      tenKH: data.ten_kh,
      sdt: data.sdt,
      diaChi: data.dia_chi,
      sanPham,
      tongTien: Number(data.tong_tien),
      thoiGian: data.thoi_gian,
      trangThai: data.trang_thai,
      maGiamGia: data.ma_giam_gia ?? undefined,
      giaTriGiam: Number(data.gia_tri_giam ?? 0),
      nguoiXuLy: data.nguoi_xu_ly || 'Chưa có',
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

    const nguoiXuLy = await getNguoiXuLy(request)

    const { error } = await supabase
      .from('don_hang')
      .update({ trang_thai: trangThai, nguoi_xu_ly: nguoiXuLy })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/don-hang/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật đơn hàng' }, { status: 500 })
  }
}
