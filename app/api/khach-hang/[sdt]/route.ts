import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sdt: string } }
) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const sdt = decodeURIComponent(params.sdt)
    const { error } = await supabase
      .from('khach_hang')
      .delete()
      .eq('sdt', sdt)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/khach-hang/[sdt] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa khách hàng' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sdt: string } }
) {
  try {
    if (!await verifyAccess(request, 'khach-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.trangThai !== undefined) updateData.trang_thai = body.trangThai
    if (body.ghiChu !== undefined) updateData.ghi_chu = body.ghiChu

    const { data, error } = await supabase
      .from('khach_hang')
      .update(updateData)
      .eq('sdt', params.sdt)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PUT /api/khach-hang/[sdt] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật khách hàng' }, { status: 500 })
  }
}
