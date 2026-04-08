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
    sizes: ((row.sizes as Array<{ ten: string; so_luong: number }>) || []).map(
      (s): SizeItem => ({ ten: s.ten, soLuong: Number(s.so_luong ?? 0) })
    ),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? Math.max(1, parseInt(searchParams.get('page')!)) : null
    const limit = page ? Math.max(1, parseInt(searchParams.get('limit') || '20')) : null
    const search = searchParams.get('search') || ''
    const danhMuc = searchParams.get('danh_muc') || ''
    const tonKho = searchParams.get('ton_kho') || ''
    const conHang = searchParams.get('con_hang') || ''

    let query = supabase.from('san_pham').select('*', { count: page ? 'exact' : undefined }).order('created_at', { ascending: false })

    if (search) query = query.ilike('ten', `%${search}%`)
    if (danhMuc) query = query.eq('danh_muc', danhMuc)
    if (conHang !== '') query = query.eq('con_hang', conHang === 'true')
    if (tonKho === 'it') query = query.gte('so_luong', 5).lte('so_luong', 30)
    else if (tonKho === 'trung_binh') query = query.gt('so_luong', 30).lte('so_luong', 100)
    else if (tonKho === 'nhieu') query = query.gt('so_luong', 100)

    if (page && limit) {
      const from = (page - 1) * limit
      query = query.range(from, from + limit - 1)
    }

    const { data, error, count } = await query
    if (error) throw error

    if (page && limit) {
      const total = count ?? 0
      return NextResponse.json({
        success: true,
        data: (data || []).map(mapRow),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    return NextResponse.json({ success: true, data: (data || []).map(mapRow) })
  } catch (error) {
    console.error('GET /api/san-pham error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách sản phẩm' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
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
        sizes: (body.sizes || []).map((s: SizeItem) => ({ ten: s.ten, so_luong: s.soLuong })),
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
