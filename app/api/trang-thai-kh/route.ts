import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trang_thai_kh')
      .select('*')
      .order('id')

    if (error) {
      // Bảng chưa tồn tại → trả mảng rỗng, không báo lỗi
      return NextResponse.json({ success: true, data: [] })
    }
    return NextResponse.json({
      success: true,
      data: (data || []).map((r) => ({ id: r.id, ten: r.ten, mau: r.mau })),
    })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.ten) {
      return NextResponse.json({ success: false, error: 'Thiếu tên trạng thái' }, { status: 400 })
    }

    const id = `tt_${Date.now()}`
    const { data, error } = await supabase
      .from('trang_thai_kh')
      .insert({ id, ten: body.ten, mau: body.mau || '#8C7B72' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('POST /api/trang-thai-kh error:', error)
    return NextResponse.json({ success: false, error: 'Không thể thêm trạng thái' }, { status: 500 })
  }
}
