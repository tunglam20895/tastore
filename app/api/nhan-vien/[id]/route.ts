import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { hashPassword } from '@/lib/staff-auth'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

async function isAdmin(request: NextRequest) {
  return verifyAccess(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
  }
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.ten !== undefined) updates.ten = body.ten.trim()
    if (body.quyen !== undefined) updates.quyen = body.quyen
    if (body.conHoatDong !== undefined) updates.con_hoat_dong = body.conHoatDong
    if (body.luong !== undefined) updates.luong = body.luong
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ success: false, error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400, headers: CORS_HEADERS })
      }
      updates.password_hash = await hashPassword(body.password)
    }

    const { error } = await supabase.from('nhan_vien').update(updates).eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('PUT /api/nhan-vien/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
  }
  try {
    const { error } = await supabase.from('nhan_vien').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('DELETE /api/nhan-vien/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Không thể xóa' }, { status: 500, headers: CORS_HEADERS })
  }
}
