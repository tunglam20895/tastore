import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAdminPassword } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminPassword = request.headers.get('x-admin-password')
    if (!adminPassword || !verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401 })
    }

    // Kiểm tra xem trạng thái có đang được dùng không
    const { data: ttRow } = await supabase
      .from('trang_thai_kh')
      .select('ten')
      .eq('id', params.id)
      .single()

    if (ttRow) {
      const { count } = await supabase
        .from('khach_hang')
        .select('*', { count: 'exact', head: true })
        .eq('trang_thai', ttRow.ten)

      if (count && count > 0) {
        return NextResponse.json(
          { success: false, error: `Trạng thái đang được dùng bởi ${count} khách hàng` },
          { status: 400 }
        )
      }
    }

    const { error } = await supabase.from('trang_thai_kh').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/trang-thai-kh/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa trạng thái' }, { status: 500 })
  }
}
