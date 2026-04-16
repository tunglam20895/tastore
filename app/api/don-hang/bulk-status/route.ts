import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { verifyStaffToken } from '@/lib/staff-auth'
import type { DonHang } from '@/types'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

async function getNguoiXuLy(request: NextRequest): Promise<string> {
  const pw = request.headers.get('x-admin-password')
  const adminPw = process.env.ADMIN_PASSWORD
  if (pw && adminPw && pw === adminPw) return 'Admin'
  const token = request.cookies.get('staff-token')?.value
  if (token) {
    const session = await verifyStaffToken(token)
    if (session) return session.ten
  }
  return 'Chưa có'
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAccess(request, 'don-hang')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
    }

    const body = await request.json()
    const ids: string[] = body.ids || []
    const trangThai: DonHang['trangThai'] = body.trangThai

    if (!ids.length || !trangThai) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu' }, { status: 400, headers: CORS_HEADERS })
    }

    const nguoiXuLy = await getNguoiXuLy(request)

    const { error } = await supabase
      .from('don_hang')
      .update({ trang_thai: trangThai, nguoi_xu_ly: nguoiXuLy })
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ success: true, updated: ids.length }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('POST /api/don-hang/bulk-status error:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật hàng loạt' }, { status: 500, headers: CORS_HEADERS })
  }
}
