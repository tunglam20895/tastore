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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.ma !== undefined) updateData.ma = (body.ma as string).toUpperCase().trim()
    if (body.loai !== undefined) updateData.loai = body.loai
    if (body.giaTri !== undefined) updateData.gia_tri = Number(body.giaTri)
    if ('giaTriToiDa' in body) updateData.gia_tri_toi_da = body.giaTriToiDa ? Number(body.giaTriToiDa) : null
    if (body.donHangToiThieu !== undefined) updateData.don_hang_toi_thieu = Number(body.donHangToiThieu)
    if (body.soLuong !== undefined) updateData.so_luong = Number(body.soLuong)
    if (body.conHieuLuc !== undefined) updateData.con_hieu_luc = body.conHieuLuc
    if ('ngayHetHan' in body) updateData.ngay_het_han = body.ngayHetHan || null

    const { data, error } = await supabase
      .from('ma_giam_gia')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (error) {
    console.error('PUT /api/ma-giam-gia/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật mã giảm giá' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ma_giam_gia')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/ma-giam-gia/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa mã giảm giá' }, { status: 500 })
  }
}
