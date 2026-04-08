import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import type { SanPham, SizeItem } from '@/types'

function computeGiaHienThi(giaGoc: number, phanTramGiam: number | null): number {
  if (!phanTramGiam) return giaGoc
  return Math.round(giaGoc * (1 - phanTramGiam / 100))
}

function mapRow(row: Record<string, unknown>): SanPham {
  const giaGoc = Number(row.gia_goc)
  const phanTramGiam = row.phan_tram_giam != null ? Number(row.phan_tram_giam) : null
  return {
    id: row.id as string,
    ten: row.ten as string,
    giaGoc,
    phanTramGiam,
    giaHienThi: computeGiaHienThi(giaGoc, phanTramGiam),
    anhURL: (row.anh_url as string) || '',
    moTa: (row.mo_ta as string) || '',
    danhMuc: (row.danh_muc as string) || '',
    conHang: row.con_hang as boolean,
    soLuong: Number(row.so_luong ?? 0),
    sizes: ((row.sizes as Array<{ ten: string; so_luong: number }>) || []).map(
      (s): SizeItem => ({ ten: s.ten, soLuong: Number(s.so_luong ?? 0) })
    ),
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.ten !== undefined) updateData.ten = body.ten
    if (body.giaGoc !== undefined) updateData.gia_goc = body.giaGoc
    if ('phanTramGiam' in body) updateData.phan_tram_giam = body.phanTramGiam
    if (body.anhURL !== undefined) updateData.anh_url = body.anhURL
    if (body.moTa !== undefined) updateData.mo_ta = body.moTa
    if (body.danhMuc !== undefined) updateData.danh_muc = body.danhMuc
    if (body.soLuong !== undefined) {
      const soLuong = Number(body.soLuong)
      updateData.so_luong = soLuong
      updateData.con_hang = soLuong > 0
    } else if (body.conHang !== undefined) {
      updateData.con_hang = body.conHang
    }
    if (body.sizes !== undefined) {
      updateData.sizes = (body.sizes as SizeItem[]).map(s => ({ ten: s.ten, so_luong: s.soLuong }))
    }

    const { data, error } = await supabase
      .from('san_pham')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (error) {
    console.error('PUT /api/san-pham/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật sản phẩm' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { error } = await supabase
      .from('san_pham')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/san-pham/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa sản phẩm' }, { status: 500 })
  }
}
