import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAccess } from '@/lib/auth'
import { hashPassword } from '@/lib/staff-auth'
import type { NhanVien } from '@/types'
import { CORS_HEADERS, handleOptions } from "@/lib/cors";

export async function OPTIONS() { return handleOptions(); }

function mapRow(row: Record<string, unknown>): NhanVien {
  return {
    id: row.id as string,
    ten: row.ten as string,
    username: row.username as string,
    quyen: (row.quyen as string[]) || [],
    conHoatDong: row.con_hoat_dong as boolean,
    luong: Number(row.luong ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Chỉ admin mới được quản lý nhân viên
async function isAdmin(request: NextRequest) {
  return verifyAccess(request)
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
  }
  try {
    const { data, error } = await supabase
      .from('nhan_vien')
      .select('id, ten, username, quyen, con_hoat_dong, luong, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(mapRow) }, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('GET /api/nhan-vien error:', e)
    return NextResponse.json({ success: false, error: 'Không thể lấy danh sách' }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 401, headers: CORS_HEADERS })
  }
  try {
    const body = await request.json()
    const { ten, username, password, quyen, luong } = body

    if (!ten?.trim() || !username?.trim() || !password?.trim()) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400, headers: CORS_HEADERS })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400, headers: CORS_HEADERS })
    }

    // Kiểm tra username trùng
    const { data: existing } = await supabase
      .from('nhan_vien').select('id').eq('username', username.trim()).single()
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username đã tồn tại' }, { status: 409, headers: CORS_HEADERS })
    }

    const passwordHash = await hashPassword(password)
    const { data, error } = await supabase
      .from('nhan_vien')
      .insert({
        ten: ten.trim(),
        username: username.trim(),
        password_hash: passwordHash,
        quyen: quyen || [],
        luong: luong ?? 0,
      })
      .select('id, ten, username, quyen, con_hoat_dong, luong, created_at, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: mapRow(data) }, { headers: CORS_HEADERS })
  } catch (e) {
    console.error('POST /api/nhan-vien error:', e)
    return NextResponse.json({ success: false, error: 'Không thể tạo nhân viên' }, { status: 500, headers: CORS_HEADERS })
  }
}
