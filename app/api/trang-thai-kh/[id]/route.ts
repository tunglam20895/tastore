import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await verifyAccess(request)) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
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
          { status: 400, headers: CORS_HEADERS }
        )
      }
    }

    const { error } = await supabase.from('trang_thai_kh').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('DELETE /api/trang-thai-kh/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa trạng thái' }, { status: 500, headers: CORS_HEADERS })
  }
}
