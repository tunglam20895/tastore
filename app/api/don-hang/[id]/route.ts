import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'
import type { DonHang } from '@/types'

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
    const trangThai = body.trangThai as DonHang['trangThai']
    if (!trangThai) {
      return NextResponse.json({ success: false, error: 'Thiếu trạng thái' }, { status: 400 })
    }

    const { error } = await supabase
      .from('don_hang')
      .update({ trang_thai: trangThai })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/don-hang/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật đơn hàng' }, { status: 500 })
  }
}
