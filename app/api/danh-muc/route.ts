import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('danh_muc')
      .select('id, ten_danh_muc')
      .order('id')

    if (error) throw error
    const categories = (data || []).map((r) => ({ id: r.id, tenDanhMuc: r.ten_danh_muc }))
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('GET /api/danh-muc error:', error)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh mục' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'san-pham')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const { error } = await supabase
      .from('danh_muc')
      .insert({ id: body.id, ten_danh_muc: body.tenDanhMuc })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/danh-muc error:', error)
    return NextResponse.json({ success: false, error: 'Không thể thêm danh mục' }, { status: 500 })
  }
}
