import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import type { KhachHang } from '@/types'
export const dynamic = "force-dynamic";

function mapRow(row: Record<string, unknown>): KhachHang {
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

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20'))
    const trangThai = searchParams.get('trang_thai') || ''
    const search = searchParams.get('search') || ''

    let query = supabase.from('khach_hang').select('*', { count: 'exact' })

    if (trangThai) query = query.eq('trang_thai', trangThai)
    if (search) query = query.or(`ten.ilike.%${search}%,sdt.ilike.%${search}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const total = count ?? 0
    return NextResponse.json({
      success: true,
      data: (data || []).map(mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/khach-hang error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách khách hàng' }, { status: 500 })
  }
}
