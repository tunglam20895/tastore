import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'
import type { MaGiamGia } from '@/types'

function mapRow(row: Record<string, unknown>): MaGiamGia {
  return {
    id: row.id as string,
    ma: row.ma as string,
    loai: row.loai as 'phan_tram' | 'so_tien',
    giaTri: Number(row.gia_tri),
    giaTriToiDa: row.gia_tri_toi_da != null ? Number(row.gia_tri_toi_da) : null,
    donHangToiThieu: Number(row.don_hang_toi_thieu ?? 0),
    soLuong: Number(row.so_luong),
    daDung: Number(row.da_dung),
    conHieuLuc: row.con_hieu_luc as boolean,
    ngayHetHan: row.ngay_het_han as string | null,
    createdAt: row.created_at as string,
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('ma_giam_gia')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(mapRow) })
  } catch (error) {
    console.error('GET /api/ma-giam-gia error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách mã giảm giá' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('ma_giam_gia')
      .insert({
        ma: (body.ma as string).toUpperCase().trim(),
        loai: body.loai,
        gia_tri: Number(body.giaTri),
        gia_tri_toi_da: body.giaTriToiDa ? Number(body.giaTriToiDa) : null,
        don_hang_toi_thieu: Number(body.donHangToiThieu ?? 0),
        so_luong: Number(body.soLuong ?? 1),
        con_hieu_luc: body.conHieuLuc !== false,
        ngay_het_han: body.ngayHetHan || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'Mã này đã tồn tại' }, { status: 400 })
      }
      throw error
    }
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (error) {
    console.error('POST /api/ma-giam-gia error:', error)
    return NextResponse.json({ success: false, error: 'Không thể tạo mã giảm giá' }, { status: 500 })
  }
}
