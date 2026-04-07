import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'
import type { SanPham } from '@/types'

function computeGiaHienThi(giaGoc: number, phanTramGiam: number | null): number {
  if (!phanTramGiam) return giaGoc
  return Math.round(giaGoc * (1 - phanTramGiam / 100))
}

function mapRow(row: Record<string, unknown>): SanPham {
  const giaGoc = Number(row.gia_goc)
  const phanTramGiam = row.phan_tram_giam != null ? Number(row.phan_tram_giam) : null
  const soLuong = Number(row.so_luong ?? 0)
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
    soLuong,
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('san_pham')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(mapRow) })
  } catch (error) {
    console.error('GET /api/san-pham error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách sản phẩm' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const soLuong = Number(body.soLuong ?? 0)
    const { data, error } = await supabase
      .from('san_pham')
      .insert({
        ten: body.ten,
        gia_goc: body.giaGoc,
        phan_tram_giam: body.phanTramGiam ?? null,
        anh_url: body.anhURL || null,
        mo_ta: body.moTa || null,
        danh_muc: body.danhMuc || null,
        so_luong: soLuong,
        con_hang: soLuong > 0,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (error) {
    console.error('POST /api/san-pham error:', error)
    return NextResponse.json({ success: false, error: 'Không thể thêm sản phẩm' }, { status: 500 })
  }
}
