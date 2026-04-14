import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sdt = (body.sdt as string)?.trim()

    if (!sdt) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập số điện thoại' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('don_hang')
      .select('*')
      .eq('sdt', sdt)
      .order('thoi_gian', { ascending: false })
      .limit(50)

    if (error) throw error

    const orders = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      tenKH: row.ten_kh as string,
      thoiGian: row.thoi_gian as string,
      trangThai: row.trang_thai as string,
      tongTien: Number(row.tong_tien),
      sanPham: (row.san_pham as Array<{ ten: string; soLuong: number; anhURL?: string }>) || [],
    }))

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('POST /api/tra-cuu-don-hang error:', error)
    return NextResponse.json(
      { success: false, error: 'Không thể tra cứu đơn hàng' },
      { status: 500 }
    )
  }
}
